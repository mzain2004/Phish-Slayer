'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTierLimits, type Tier, type Role } from '@/lib/rbac/tierLimits'

export function useTier() {
  const [tier, setTier] = useState<Tier>('recon')
  const [role, setRole] = useState<Role>('analyst')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setLoading(false)
        return
      }
      supabase.from('profiles')
        .select('subscription_tier, role')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setTier((profile.subscription_tier as Tier) ?? 'recon')
            setRole((profile.role as Role) ?? 'analyst')
          }
          setLoading(false)
        })
    })
  }, [])

  const limits = getTierLimits(tier)
  const isSuperAdmin = role === 'super_admin'

  return { tier, role, limits, isSuperAdmin, loading }
}
