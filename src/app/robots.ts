import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://med-qs0.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/settings/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
