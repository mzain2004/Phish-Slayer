import React from 'react';
import Link from 'next/link';
import { LucideIcon, HelpCircle } from 'lucide-react';
import PhishButton from './PhishButton';

interface EmptyStateProps {
  icon?: LucideIcon | string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export default function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-6 h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#7c6af7]">
        {typeof Icon === 'string' ? (
          <span className="text-5xl">{Icon}</span>
        ) : (
          <Icon className="h-10 w-10" />
        )}
      </div>
      <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">{title}</h3>
      <p className="text-[#64748b] max-w-sm mb-8">{description}</p>
      
      {(actionLabel && (actionHref || actionOnClick)) && (
        actionHref ? (
          <Link href={actionHref}>
            <PhishButton className="bg-[#7c6af7] text-white px-8 py-2 font-bold rounded-[4px]">
              {actionLabel}
            </PhishButton>
          </Link>
        ) : (
          <PhishButton 
            onClick={actionOnClick}
            className="bg-[#7c6af7] text-white px-8 py-2 font-bold rounded-[4px]"
          >
            {actionLabel}
          </PhishButton>
        )
      )}
    </div>
  );
}
