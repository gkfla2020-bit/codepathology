import { useState } from "react";

interface Props {
  code: string;
  language: string;
}

export default function ShareCode({ code, language }: Props) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const generateShareUrl = () => {
    const encoded = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}/student?shared=${encoded}&lang=${language}`;
    return url;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCode = () => copyToClipboard(code);
  const copyUrl = () => copyToClipboard(generateShareUrl());

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="text-[11px] text-txt-tertiary hover:text-toss-blue transition px-2 py-1"
        title="코드 공유"
      >
        🔗 공유
      </button>
    );
  }

  return (
    <div className="absolute top-12 right-[350px] z-50 bg-bg-card border border-line-primary rounded-xl shadow-2xl p-4 w-72 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-txt-primary">코드 공유</span>
        <button onClick={() => setShowPanel(false)} className="text-txt-tertiary hover:text-txt-primary text-sm">×</button>
      </div>
      <div className="space-y-2">
        <button
          onClick={copyCode}
          className="w-full text-left px-3 py-2.5 rounded-lg text-xs bg-bg-elevated hover:bg-bg-hover text-txt-secondary transition flex items-center justify-between"
        >
          <span>📋 코드 복사</span>
          {copied && <span className="text-status-safe text-[10px]">복사됨!</span>}
        </button>
        <button
          onClick={copyUrl}
          className="w-full text-left px-3 py-2.5 rounded-lg text-xs bg-bg-elevated hover:bg-bg-hover text-txt-secondary transition flex items-center justify-between"
        >
          <span>🔗 공유 URL 복사</span>
          {copied && <span className="text-status-safe text-[10px]">복사됨!</span>}
        </button>
        <p className="text-[10px] text-txt-tertiary mt-2">공유 URL에는 현재 코드가 인코딩되어 포함됩니다</p>
      </div>
    </div>
  );
}
