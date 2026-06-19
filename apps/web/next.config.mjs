/** @type {import('next').NextConfig} */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace package from source.
  transpilePackages: ['@pms/shared'],
  // Linting is owned by the dedicated `turbo lint` task (eslint flat config),
  // so we don't double-run a divergent ESLint pass during the production build.
  eslint: { ignoreDuringBuilds: true },
  // BFF proxy: the browser talks to same-origin /api, so the backend's httpOnly
  // auth cookie is stored on the web origin and middleware can read it.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
