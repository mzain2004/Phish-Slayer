'use client';

import { useEffect, useState } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaddleCheckoutButtonProps {
  priceId: string;
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export default function PaddleCheckoutButton({
  priceId,
  variant = 'primary',
  children,
  className = '',
}: PaddleCheckoutButtonProps) {
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        if (!token) {
          throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing');
        }

        const p = await initializePaddle({
          environment: 'production',
          token: token,
        });

        if (active) {
          setPaddle(p);
          console.log('Paddle initialized successfully');
        }
      } catch (error) {
        console.error('CRITICAL: Failed to initialize Paddle:', error);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  const handleCheckout = () => {
    if (!paddle) {
      toast.error('Payment system loading. Please try again.');
      return;
    }
    openCheckout(paddle);
  };

  const openCheckout = (p: Paddle) => {
    setLoading(true);
    try {
      p.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          locale: 'en',
        },
      });
    } catch (err) {
      console.error('Paddle Checkout Open Error:', err);
      toast.error('Failed to open checkout. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const baseStyles = "inline-flex justify-center items-center gap-2 font-bold text-[15px] px-8 py-3 rounded-full tracking-[0.01em] transition-all duration-200 disabled:opacity-50";
  const variants = {
    primary: "bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#0D1117] hover:-translate-y-0.5 hover:shadow-lg",
    outline: "bg-transparent border border-[#30363D] hover:border-[#2DD4BF] text-[#E6EDF3] hover:text-[#2DD4BF] hover:-translate-y-0.5"
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !paddle}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {(loading || !paddle) ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}
