import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  green?: boolean;
  hover?: boolean;
};

export function Card({ children, className = "", green, hover }: Props) {
  const base = "rounded-2xl border p-6 transition-colors";
  const style = green
    ? "bg-brand-500 text-black border-brand-500"
    : `bg-card border-border text-fg ${hover ? "hover:border-border-hover hover:bg-card-hover" : ""}`;
  return <div className={`${base} ${style} ${className}`}>{children}</div>;
}
