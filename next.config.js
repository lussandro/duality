/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

require('dotenv').config();

module.exports = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/whatsapp',
        destination: 'https://wa.me/5511954432178',
        permanent: true,
      },
      {
        source: '/telegram',
        destination: 'https://t.me/findy_buscas_bot',
        permanent: true,
      },
    ];
  },
};
