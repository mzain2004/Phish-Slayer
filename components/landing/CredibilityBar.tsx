export function CredibilityBar() {
  const techs = ["Next.js", "Supabase", "Azure", "Google Gemini", "VirusTotal"];

  return (
    <section className="bg-[#0D1117] border-b border-[#1C2128] py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <span className="font-mono text-[11px] text-[#8B949E] uppercase tracking-[0.15em] shrink-0">Built With</span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {techs.map((t) => (
            <div key={t} className="bg-[#161B22] border border-[#30363D] rounded-[4px] px-4 py-2 font-mono text-[11px] text-[#8B949E] tracking-wide">
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
