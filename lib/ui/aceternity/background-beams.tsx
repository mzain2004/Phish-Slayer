"use client";

export function BackgroundBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0" />
            <stop offset="50%" stopColor="#0d9488" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={`${-20 + i * 30}%`}
            y1="0%"
            x2={`${80 + i * 30}%`}
            y2="100%"
            stroke={i % 2 === 0 ? "url(#beam1)" : "url(#beam2)"}
            strokeWidth="1"
            className={`animate-beam-${i + 1}`}
          />
        ))}
      </svg>
    </div>
  );
}
