/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/book", destination: "/services", permanent: true },
      // The Lead Queue merged into /admin/leads as its "Queue" tab. Query
      // strings carry over automatically, so an old ?lead=<id> deep link still
      // opens the right drawer.
      {
        source: "/admin/lead-queue",
        destination: "/admin/leads?tab=queue",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
