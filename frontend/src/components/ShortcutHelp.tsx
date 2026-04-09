interface Props { open: boolean; onClose: () => void; }

const SHORTCUTS = [
  { keys: "⌘ + Enter", desc: "코드 실행" },
  { keys: "⌘ + S", desc: "코드 저장" },
  { keys: "⌘ + /", desc: "줄 주석 토글" },
  { keys: "⌘ + D", desc: "단어 선택 (다중 커서)" },
  { keys: "⌘ + Shift + K", desc: "줄 삭제" },
  { keys: "Alt + ↑/↓", desc: "줄 이동" },
  { keys: "⌘ + Z / ⌘ + Shift + Z", desc: "실행 취소 / 다시 실행" },
  { keys: "Tab / Shift + Tab", desc: "들여쓰기 / 내어쓰기" },
  { keys: "⌘ + ?", desc: "단축키 도움말" },
];

export default function ShortcutHelp({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg-card rounded-2xl p-6 w-[380px] shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-txt-primary">⌨️ 키보드 단축키</h2>
          <button onClick={onClose} className="text-txt-tertiary hover:text-txt-primary text-lg">×</button>
        </div>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-bg-elevated transition">
              <span className="text-[11px] text-txt-secondary">{s.desc}</span>
              <kbd className="text-[10px] font-mono bg-bg-elevated text-txt-tertiary px-2 py-0.5 rounded border border-line-primary">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
