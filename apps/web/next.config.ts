import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['leaflet', 'leaflet.markercluster'],
};

export default nextConfig;
