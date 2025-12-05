import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export default function IDEEditor({ value, onChange, language }: Props) {
  const getLang = () => {
    switch (language.toLowerCase()) {
      case "cpp":
      case "c++":
        return cpp();
      case "python":
      case "py":
        return python();
      case "javascript":
      case "js":
        return javascript();
      default:
        return javascript();
    }
  };

  return (
    <CodeMirror
      value={value}
      height="420px"
      theme={oneDark}
      extensions={[getLang()]}
      onChange={(val) => onChange(val)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
    />
  );
}
