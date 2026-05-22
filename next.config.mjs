
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌟 Forza Next.js a convertire correttamente i moduli di FullCalendar
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/daygrid',
    '@fullcalendar/interaction',
    '@fullcalendar/list',
    '@fullcalendar/react',
    '@fullcalendar/timegrid'
  ],
};

export default nextConfig;