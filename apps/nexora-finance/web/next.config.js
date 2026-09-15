const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production'
      ? { properties: ['^data-testid$'] }
      : false,
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  modularizeImports: {
    'lodash': { transform: 'lodash/{{member}}' },
    'react-icons': { transform: 'react-icons/{{member}}' },
    '@mui/icons-material': { transform: '@mui/icons-material/{{member}}' },
  },

  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'date-fns',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'lodash',
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  trailingSlash: false,
  productionBrowserSourceMaps: false,

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const securityHeaders = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          ...(isDev ? [] : [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]),
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Accept-CH', value: 'Viewport-Width, Width, DPR' },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}
                https://www.googletagmanager.com
                https://cdn.onesignal.com
                https://onesignal.com
                https://api.onesignal.com
                https://api.iconify.design
                https://api.simplesvg.com
                https://api.unisvg.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https: ${isDev ? 'http://127.0.0.1:8000 http://localhost:8000' : ''};
              font-src 'self' data:;
              connect-src 'self'
                https://*.googleapis.com
                https://*.firebaseio.com
                https://www.google-analytics.com
                https://cdn.onesignal.com
                https://onesignal.com
                https://api.onesignal.com
                https://api.iconify.design
                https://api.simplesvg.com
                https://api.unisvg.com
                ${isDev ? 'http://127.0.0.1:8000 http://localhost:8000 ws: wss:' : ''};
              frame-src 'self' https://onesignal.com;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];

    const staticAssetCachingHeaders = isDev
      ? [{
          source: '/_next/static/(.*)',
          headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
        }]
      : [
          {
            source: '/(.*).(jpg|jpeg|png|gif|ico|svg|webp|avif)',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
          {
            source: '/_next/static/(.*)',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
        ];

    return [...securityHeaders, ...staticAssetCachingHeaders];
  },
};

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
