"use client";

import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-8 w-full max-w-6xl mx-auto py-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-[#1a1a2e] rounded-lg" />
          <div className="h-4 w-96 bg-[#1a1a2e] rounded-lg opacity-50" />
        </div>
        <div className="h-12 w-48 bg-[#1a1a2e] rounded-xl" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#1a1a2e] border border-white/5 rounded-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2a2a4e]/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>

      {/* Table/List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-[#1a1a2e] border border-white/5 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2a2a4e]/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
