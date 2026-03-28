const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://app.termly.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://app.termly.io; img-src * data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.paddle.com https://*.supabase.co https://*.supabase.in https://app.termly.io wss://*.supabase.co wss://phishslayer.tech https://www.virustotal.com; frame-src https://buy.paddle.com https://*.paddle.com https://app.termly.io;"
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'phishslayer.tech',
        'www.phishslayer.tech',
        '40.123.224.93',
        'localhost:3000',
      ]
    }
  }
};

module.exports = nextConfig;
