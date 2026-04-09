import { useRef, useCallback, useEffect } from "react";
import { useStore } from "../stores/useStore";
import { useWebSocket } from "./useWebSocket";

export function useHeartbeat(studentId: number | null) {
  const setHeartbeatStatus = useStore((s) => s.setHeartbeatStatus);

  const charCountRef = useRef(0);
  const deleteCountRef = useRef(0);
  const lastInputRef = useRef(Date.now());
  const pauseSentRef = useRef(false);
  const errorCountRef = useRef(0);
  const lastLineRef = useRef(0);

  const { send } = useWebSocket({
    url: `/ws/heartbeat/${studentId}`,
    onMessage: () => {},
    enabled: !!studentId,
  });

  // Aggregate typing stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const total = charCountRef.current + deleteCountRef.current;
      if (total > 0) {
        const charsPerMin = charCountRef.current * 6; // 10s → 1min
        const deleteRatio = deleteCountRef.current / Math.max(total, 1);
        send({
          type: "heartbeat",
          event: "typing",
          data: { chars_per_min: charsPerMin, delete_ratio: Math.round(deleteRatio * 100) / 100 },
        });
        charCountRef.current = 0;
        deleteCountRef.current = 0;
        pauseSentRef.current = false;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [send]);

  // Detect pause (30s+ no input)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastInputRef.current) / 1000;
      if (elapsed >= 30 && !pauseSentRef.current) {
        pauseSentRef.current = true;
        send({
          type: "heartbeat",
          event: "pause",
          data: { duration_sec: Math.round(elapsed), last_line: lastLineRef.current },
        });
      }
      // Update status
      if (elapsed >= 600 && errorCountRef.current >= 5) {
        setHeartbeatStatus("danger");
      } else if (elapsed >= 300 || errorCountRef.current >= 3) {
        setHeartbeatStatus("stalled");
      } else {
        setHeartbeatStatus("normal");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [send, setHeartbeatStatus]);

  const handleCodeChange = useCallback(
    (value: string | undefined, ev: unknown) => {
      lastInputRef.current = Date.now();
      const changes = (ev as { changes?: { text: string; rangeLength: number }[] })?.changes;
      if (changes) {
        for (const c of changes) {
          if (c.rangeLength > 0) deleteCountRef.current += c.rangeLength;
          if (c.text.length > 0) charCountRef.current += c.text.length;
        }
      }
    },
    []
  );

  const handleError = useCallback(
    (markers: { message: string; startLineNumber: number }[]) => {
      for (const m of markers) {
        errorCountRef.current++;
        lastLineRef.current = m.startLineNumber;
        send({
          type: "heartbeat",
          event: "error",
          data: { message: m.message, line: m.startLineNumber },
        });
      }
    },
    [send]
  );

  const setLastLine = useCallback((line: number) => {
    lastLineRef.current = line;
  }, []);

  return { handleCodeChange, handleError, setLastLine };
}
