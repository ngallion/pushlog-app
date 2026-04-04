import { useState, useEffect } from "react";

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value: number;
  onChange: (value: number) => void;
}

export function NumericInput({ value, onChange, onBlur, ...rest }: Props) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={(e) => {
        const raw = e.target.value;
        setLocalValue(raw);
        const parsed = Number(raw);
        if (raw !== "" && !isNaN(parsed)) {
          onChange(parsed);
        }
      }}
      onBlur={(e) => {
        const parsed = Number(localValue);
        if (localValue === "" || isNaN(parsed)) {
          setLocalValue(String(value));
        }
        onBlur?.(e);
      }}
    />
  );
}
