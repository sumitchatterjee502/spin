type DataTableContentProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function DataTableContent({
  title,
  description,
  children,
}: DataTableContentProps) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
