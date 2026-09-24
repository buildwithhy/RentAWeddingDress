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
    ];
  },

};

export default nextConfig;
