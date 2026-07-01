type Props = { selected?: boolean; children: string; onClick?: () => void };

export function Chip({ selected, children, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
      {children}
    </button>
  );
}
