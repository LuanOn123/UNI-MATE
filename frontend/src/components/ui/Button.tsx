import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; icon?: ReactNode };

export function Button({ className = "", variant = "primary", icon, children, ...props }: Props) {
  const styles = {
    primary: "bg-coffee text-white shadow-[0_12px_28px_rgba(111,78,55,0.22)] hover:bg-cocoa",
    ghost: "bg-white/78 text-coffee hover:bg-white border border-coffee/10 shadow-sm",
    danger: "bg-rose-600 text-white shadow-[0_12px_28px_rgba(225,29,72,0.18)] hover:bg-rose-700"
  };
  return (
    <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
