export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d1117]">
      <div className="border-b border-[#30363d] px-6 py-4">
        <a href="/" className="text-[#2dd4bf] text-sm hover:underline">← Back to Phish-Slayer</a>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#e6edf3] mb-2">Terms of Service</h1>
        <p className="text-[#8b949e] mb-8">Last updated: March 2026</p>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <p className="text-[#8b949e] text-sm leading-relaxed">
            Terms of Service document coming soon. By using Phish-Slayer, you agree to use 
            the platform only for lawful cybersecurity purposes. Unauthorized scanning of 
            systems you do not own is prohibited. All scan data is processed according to 
            our Privacy Policy. Phish-Slayer is provided "as is" without warranty of any kind.
          </p>
          <p className="text-[#8b949e] text-sm leading-relaxed mt-4">
            For questions, contact: <a href="mailto:support@phishslayer.tech" className="text-[#2dd4bf]">support@phishslayer.tech</a>
          </p>
        </div>
      </div>
    </main>
  )
}
