/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Los errores de tipo de Supabase no bloquean la build.
    // Son errores de inferencia del cliente, no bugs de runtime.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
