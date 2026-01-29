/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isso é opcional, mas ajuda se você estiver servindo localmente
  output: 'standalone',
  
  // Resolver aviso sobre múltiplos lockfiles
  outputFileTracingRoot: require('path').join(__dirname),
  
  // Variáveis de ambiente públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Rewrites para proxy de API durante desenvolvimento (opcional)
  async rewrites() {
    return [
      // Descomente para usar proxy durante desenvolvimento
      // {
      //   source: '/backend/:path*',
      //   destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      // },
    ];
  },
};

export default nextConfig;
