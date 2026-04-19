"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type SessionGuardProps = {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  onUserChange?: (user: User | null) => void;
};

export default function SessionGuard({
  children,
  loadingFallback = null,
  onUserChange,
}: SessionGuardProps) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const initialSessionResolvedRef = useRef(false);
  const [initialSessionResolved, setInitialSessionResolved] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) {
        return;
      }

      if (event === "INITIAL_SESSION") {
        initialSessionResolvedRef.current = true;
        setInitialSessionResolved(true);
        onUserChange?.(session?.user ?? null);
        return;
      }

      if (!initialSessionResolvedRef.current) {
        return;
      }

      if (event === "SIGNED_OUT") {
        onUserChange?.(null);
        router.replace("/");
        return;
      }

      if (event === "SIGNED_IN") {
        onUserChange?.(session?.user ?? null);
        router.replace("/dashboard");
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        return;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onUserChange, router]);

  if (!initialSessionResolved) {
    return loadingFallback;
  }

  return children;
}
