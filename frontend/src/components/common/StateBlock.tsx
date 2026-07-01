import { Coffee } from "lucide-react";

export function StateBlock({ title, text }: { title: string; text?: string }) {
  return (
    <div className="glass flex min-h-48 flex-col items-center justify-center rounded-lg p-8 text-center shadow-soft">
      <Coffee className="mb-3 h-9 w-9 text-caramel" />
      <h3 className="text-lg font-bold text-cocoa">{title}</h3>
      {text ? <p className="mt-2 max-w-md text-sm text-coffee/70">{text}</p> : null}
    </div>
  );
}
