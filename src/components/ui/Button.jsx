const styles = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  ghost: 'bg-transparent border border-base-border hover:bg-base-panel text-slate-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white'
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
