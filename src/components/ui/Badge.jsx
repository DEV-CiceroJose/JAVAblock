export default function Badge({ color = '#4f8cff', children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color + '22', color }}>
      {children}
    </span>
  );
}
