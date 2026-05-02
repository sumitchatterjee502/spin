type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 ${className}`}
      {...props}
    />
  );
}
