import Editor from "@monaco-editor/react";
import { useStore } from "../stores/useStore";
import { useHeartbeat } from "../hooks/useHeartbeat";

interface Props {
  studentId: number | null;
  theme?: string;
  fontSize?: number;
}

export default function MonacoEditor({ studentId, theme = "vs-dark", fontSize = 14 }: Props) {
  const { code, language, setCode } = useStore();
  const { handleCodeChange, handleError } = useHeartbeat(studentId);

  return (
    <div className="h-full flex flex-col">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme={theme}
        options={{
          fontSize,
          minimap: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderWhitespace: "selection",
          tabSize: 4,
        }}
        onChange={(value, ev) => {
          setCode(value || "");
          handleCodeChange(value, ev);
        }}
        onValidate={(markers) => {
          handleError(
            markers.map((m) => ({
              message: m.message,
              startLineNumber: m.startLineNumber,
            }))
          );
        }}
      />
    </div>
  );
}
