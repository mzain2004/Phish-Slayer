'use client'
import { useEffect, useState } from 'react'
import { Shield, X } from 'lucide-react'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.location.pathname.startsWith('/dashboard')) return
    const seen = localStorage.getItem('phishslayer_consent_seen')
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = (type: 'accept' | 'decline' | 'manage') => {
    localStorage.setItem('phishslayer_consent_seen', type)
    setVisible(false)
  }

  const handleManage = () => {
    const el = document.querySelector('.termly-display-preferences') as HTMLElement
    if (el) el.click()
    dismiss('manage')
  }

  if (!visible) return null

  return (
    <div
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      className="fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-out bg-[#161b22] border-t border-[#30363d] shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1">
            <Shield className="text-[#2dd4bf] mt-0.5 shrink-0" size={20} />
            <div>
              <p className="text-[#e6edf3] font-semibold text-sm mb-1">
                Privacy & Cookie Notice
              </p>
              <p className="text-[#8b949e] text-xs leading-relaxed max-w-2xl">
                Phish-Slayer collects endpoint telemetry to power threat intelligence. 
                We use cookies for authentication and analytics. Your data is encrypted, 
                stored securely in Supabase, and never sold to third parties.{' '}
                <a href="/legal/privacy" className="text-[#2dd4bf] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleManage}
              className="border border-[#30363d] text-[#8b949e] hover:border-[#2dd4bf] hover:text-[#2dd4bf] text-xs px-4 py-2 rounded-lg transition-all whitespace-nowrap"
            >
              Manage Preferences
            </button>
            <button
              onClick={() => dismiss('decline')}
              className="border border-[#30363d] text-[#8b949e] hover:border-[#f85149] hover:text-[#f85149] text-xs px-4 py-2 rounded-lg transition-all whitespace-nowrap"
            >
              Decline Non-Essential
            </button>
            <button
              onClick={() => dismiss('accept')}
              className="bg-[#2dd4bf] text-[#0d1117] font-semibold text-xs px-4 py-2 rounded-lg hover:bg-[#14b8a6] transition-all whitespace-nowrap"
            >
              Accept All
            </button>
          </div>

          {/* Close X */}
          <button
            onClick={() => dismiss('decline')}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors shrink-0 self-start md:self-center"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
