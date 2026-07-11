export default function Card({ className = '', ...props }) {
  return (
    <div
      className={`bg-base-panel border border-base-border rounded-xl shadow-md shadow-black/20 ${className}`}
      {...props}
    />
  );
}
