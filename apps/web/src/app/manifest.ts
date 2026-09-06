import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KisanSeva',
    short_name: 'KisanSeva',
    description: 'Empowering Every Farmer with the Power of AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#84cc16',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
