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
      <h5
        className="text-xs font-mono tracking-widest uppercase mb-2"
        style={{ color: "#00d4ff44" }}
      >
        {title}
      </h5>
      <Tag className={`space-y-1 ${ordered ? "" : ""}`}>
        {items.map((item, idx) => (
          <li
            key={idx}
            className="text-xs leading-relaxed flex items-start gap-2"
            style={{ color: "#cbd5e1" }}
          >
            {ordered ? (
              <span
                className="text-xs font-mono flex-shrink-0 w-4"
                style={{ color: "#00d4ff33" }}
              >
                {idx + 1}.
              </span>
            ) : (
              <span
                className="text-xs font-mono flex-shrink-0"
                style={{ color: "#00d4ff44" }}
              >
                ›
              </span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </Tag>
    </div>
  );
}
