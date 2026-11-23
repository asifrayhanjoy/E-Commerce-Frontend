const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="fade-up">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-700">
        ARJ edit
      </p>
      <h2 className="text-2xl font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 h-px w-full max-w-[220px] bg-gradient-to-r from-blue-600 via-emerald-500/45 to-transparent" />
    </div>
  );
};

export default SectionTitle;
