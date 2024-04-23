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
        destination: 'https://wa.me/5548999357781',
        permanent: true,
      },
      {
        source: '/telegram',
        destination: 'https://t.me/luss2024',
        permanent: true,
      },
    ];
  },
};
