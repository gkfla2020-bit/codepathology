import { useState } from "react";

interface Template {
  id: string;
  label: string;
  language: string;
  code: string;
}

const TEMPLATES: Template[] = [
  {
    id: "java-main", label: "Java Main", language: "java",
    code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  },
  {
    id: "java-class", label: "Java Class", language: "java",
    code: `public class MyClass {\n    private int value;\n\n    public MyClass(int value) {\n        this.value = value;\n    }\n\n    public int getValue() {\n        return value;\n    }\n}`,
  },
  {
    id: "java-arraylist", label: "Java ArrayList", language: "java",
    code: `import java.util.ArrayList;\n\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> list = new ArrayList<>();\n        list.add("item1");\n        list.add("item2");\n        for (String item : list) {\n            System.out.println(item);\n        }\n    }\n}`,
  },
  {
    id: "py-main", label: "Python Main", language: "python",
    code: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
  },
  {
    id: "py-class", label: "Python Class", language: "python",
    code: `class MyClass:\n    def __init__(self, value):\n        self.value = value\n\n    def get_value(self):\n        return self.value\n\nobj = MyClass(42)\nprint(obj.get_value())`,
  },
  {
    id: "js-fetch", label: "JS Fetch", language: "javascript",
    code: `async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    console.log(data);\n    return data;\n  } catch (error) {\n    console.error("Fetch error:", error);\n  }\n}`,
  },
  {
    id: "js-array", label: "JS Array Methods", language: "javascript",
    code: `const numbers = [1, 2, 3, 4, 5];\n\nconst doubled = numbers.map(n => n * 2);\nconst evens = numbers.filter(n => n % 2 === 0);\nconst sum = numbers.reduce((acc, n) => acc + n, 0);\n\nconsole.log("doubled:", doubled);\nconsole.log("evens:", evens);\nconsole.log("sum:", sum);`,
  },
];

interface Props {
  language: string;
  onSelect: (code: string) => void;
}

export default function CodeTemplates({ language, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const filtered = TEMPLATES.filter((t) => t.language === language);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-txt-tertiary hover:text-toss-blue transition px-2 py-1"
        title="코드 템플릿"
      >
        📋 템플릿
      </button>
    );
  }

  return (
    <div className="absolute top-12 left-4 z-50 bg-bg-card border border-line-primary rounded-xl shadow-2xl p-3 w-64 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-txt-primary">코드 템플릿</span>
        <button onClick={() => setOpen(false)} className="text-txt-tertiary hover:text-txt-primary text-sm">×</button>
      </div>
      <div className="space-y-1">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => { onSelect(t.code); setOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-txt-secondary hover:bg-bg-elevated hover:text-txt-primary transition"
          >
            {t.label}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-[11px] text-txt-tertiary py-2">이 언어의 템플릿이 없습니다</p>
        )}
      </div>
    </div>
  );
}
