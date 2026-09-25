/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'dress-backend.runasp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dress-backend.runasp.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // ==========================================================================
  // BACKEND PROXY REWRITES:
  // Proxies /api/... and /Content/... requests from Next.js (port 3000) 
  // to the ASP.NET Web API backend running on IIS Express (port 55351)
  // ==========================================================================
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:55351/api/:path*',
      },
      {
        source: '/Content/:path*',
        destination: 'http://localhost:55351/Content/:path*',
      },
      {
        source: '/content/:path*',
        destination: 'http://localhost:55351/Content/:path*',
      },
    ];
  },

};

export default nextConfig;
