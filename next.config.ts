import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js'],
  outputFileTracingIncludes: {
    '/api/experiences': ['./node_modules/tesseract.js-core/*.wasm'],
  },
};

export default nextConfig;
