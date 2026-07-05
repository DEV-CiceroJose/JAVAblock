export default function Card({ className = '', ...props }) {
  return <div className={`bg-base-panel border border-base-border rounded-xl ${className}`} {...props} />;
}
