import { useState, useCallback, useRef, useEffect } from "react";

export function useResizable(initialSize: number, min: number, max: number, direction: "vertical" | "horizontal" = "vertical") {
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startPos.current = direction === "vertical" ? e.clientY : e.clientX;
    startSize.current = size;
  }, [size, direction]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = direction === "vertical"
        ? startPos.current - e.clientY
        : e.clientX - startPos.current;
      setSize(Math.min(max, Math.max(min, startSize.current + delta)));
    };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [min, max, direction]);

  return { size, onMouseDown };
}
