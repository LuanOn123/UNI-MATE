import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return <input ref={ref} className={`w-full rounded-lg border border-coffee/15 bg-white px-4 py-3 outline-none ring-caramel/30 transition focus:ring-4 ${className}`} {...props} />;
  }
);

Input.displayName = "Input";
