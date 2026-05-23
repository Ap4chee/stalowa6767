/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const ttsUrl = (
      process.env.NEXT_PUBLIC_TTS_URL || 'https://tts.szpitale.jakubw.cloud'
    ).replace(/\/$/, '');
    return [
      {
        source: '/api/backend/voice-control',
        destination: `${ttsUrl}/api/voice-control`
      },
      ...(apiUrl
        ? [
            {
              source: '/api/backend/:path*',
              destination: `${apiUrl}/api/:path*`
            }
          ]
        : [])
    ];
  }
};

module.exports = nextConfig;
