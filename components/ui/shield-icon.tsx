'use client'

export default function ShieldIcon() {
  return (
    <div style={{
      position: 'relative',
      width: '120px',
      height: '120px',
      margin: '0 auto 32px',
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: 'absolute',
        inset: '-8px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)',
        animation: 'pulse-ring 3s ease-in-out infinite',
      }} />
      
      {/* Shield SVG */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.4))' }}
      >
        {/* Shield shape */}
        <path 
          d="M50 8L12 24V52C12 70 28 85 50 92C72 85 88 70 88 52V24L50 8Z" 
          fill="rgba(45,212,191,0.08)"
          stroke="#2DD4BF"
          strokeWidth="1.5"
        />
        {/* Inner shield */}
        <path 
          d="M50 18L22 30V52C22 66 34 78 50 84C66 78 78 66 78 52V30L50 18Z" 
          fill="rgba(45,212,191,0.05)"
          stroke="rgba(45,212,191,0.4)"
          strokeWidth="1"
        />
        {/* Check mark */}
        <path 
          d="M35 50L45 60L65 40" 
          stroke="#2DD4BF" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
