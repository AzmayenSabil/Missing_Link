interface ActionItemListProps {
  title: string;
  items: string[];
  ordered?: boolean;
  className?: string;
}

export default function ActionItemList({
  title,
  items,
  ordered = false,
  className = "",
}: ActionItemListProps) {
  if (items.length === 0) return null;

  const Tag = ordered ? "ol" : "ul";

  return (
    <div className={className}>
      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {title}
      </h5>
      <Tag className={`space-y-1 ${ordered ? "list-decimal list-inside" : ""}`}>
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-slate-700 leading-relaxed">
            {!ordered && <span className="text-primary-400 mr-1">&#8226;</span>}
            {item}
          </li>
        ))}
      </Tag>
    </div>
  );
}
