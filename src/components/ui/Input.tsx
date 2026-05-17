"use client";

import { ReactNode } from "react";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  icon?: ReactNode;
  placeholder?: string;
  step?: number;
};

export function NumberInput({
  label,
  value,
  onChange,
  suffix = "€",
  icon,
  placeholder = "0",
  step = 1,
}: Props) {
  return (
    <label className="block group">
      <span className="mb-2 flex items-center gap-2 text-xs font-medium text-muted">
        {icon}
        {label}
      </span>
      <div className="relative flex h-11 items-center rounded-xl border border-border bg-surface px-3 transition-colors focus-within:border-brand-500/60 focus-within:bg-bg">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) && value !== 0 ? value : ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
          placeholder={placeholder}
          step={step}
          min={0}
          className="w-full bg-transparent text-fg placeholder:text-dim focus:outline-none text-sm"
        />
        <span className="ml-2 text-xs text-dim">{suffix}</span>
      </div>
    </label>
  );
}
