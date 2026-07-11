const styles = {
  primary: 'bg-accent hover:bg-accent-hover text-white hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02]',
  ghost: 'bg-transparent border border-base-border hover:bg-base-panel text-slate-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02]'
};

const ringStyles = {
  accent: 'focus-visible:ring-accent',
  adminAccent: 'focus-visible:ring-adminAccent'
};

export default function Button({ variant = 'primary', accent = 'accent', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:hover:scale-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-bg
        ${ringStyles[accent]} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
