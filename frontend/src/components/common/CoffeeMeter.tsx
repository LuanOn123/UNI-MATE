type Props = {
  value?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export function CoffeeMeter({ value = 0, size = "md", label }: Props) {
  const score = Math.max(0, Math.min(100, Math.round(value)));
  const sizes = {
    sm: { cup: "h-10 w-9", score: "text-[10px]" },
    md: { cup: "h-14 w-12", score: "text-xs" },
    lg: { cup: "h-20 w-16", score: "text-sm" }
  }[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`relative ${sizes.cup}`}>
        <div className="absolute -right-3 top-1/3 h-5 w-4 rounded-r-full border-2 border-l-0 border-coffee bg-white" />
        <div className="absolute inset-0 overflow-hidden rounded-b-[1.2rem] rounded-t-md border-2 border-coffee bg-white shadow-sm">
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coffee via-caramel to-latte transition-all duration-700 ease-out"
            style={{ height: `${score}%` }}
          />
          <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-coffee/18" />
          <div className="absolute inset-0 grid place-items-center">
            <span className={`font-black ${sizes.score} ${score > 48 ? "text-white" : "text-coffee"}`}>{score}</span>
          </div>
        </div>
      </div>
      {label ? <p className="text-[10px] font-bold uppercase tracking-wide text-coffee/55">{label}</p> : null}
    </div>
  );
}
