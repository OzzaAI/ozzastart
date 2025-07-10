import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Coach resources are available to both coaches and admins

    // Mock resources data for now
    const resources = [
      {
        id: '1',
        title: 'Website Design Best Practices',
        description: 'Comprehensive guide for creating effective business websites',
        type: 'document',
        category: 'guides',
        fileName: 'website-design-guide.pdf',
        fileSize: 2048000,
        uploadDate: '2 weeks ago',
        downloadCount: 15,
        sharedWithAgencies: 8,
        fileUrl: '/resources/website-design-guide.pdf',
        tags: ['design', 'websites', 'best-practices'],
      },
      {
        id: '2',
        title: 'Professional Service Template',
        description: 'Pre-built template for professional service businesses',
        type: 'template',
        category: 'templates',
        fileName: 'professional-service-template.zip',
        fileSize: 5120000,
        uploadDate: '1 week ago',
        downloadCount: 23,
        sharedWithAgencies: 12,
        fileUrl: '/resources/professional-service-template.zip',
        tags: ['template', 'professional-services', 'business'],
      },
      {
        id: '3',
        title: 'Client Onboarding Process',
        description: 'Step-by-step video guide for onboarding new clients',
        type: 'video',
        category: 'videos',
        fileName: 'client-onboarding.mp4',
        fileSize: 15360000,
        uploadDate: '3 days ago',
        downloadCount: 7,
        sharedWithAgencies: 5,
        fileUrl: '/resources/client-onboarding.mp4',
        tags: ['onboarding', 'process', 'clients'],
      },
      {
        id: '4',
        title: 'Brand Assets Collection',
        description: 'Logos, icons, and design elements for agency use',
        type: 'image',
        category: 'assets',
        fileName: 'brand-assets.zip',
        fileSize: 10240000,
        uploadDate: '5 days ago',
        downloadCount: 19,
        sharedWithAgencies: 10,
        fileUrl: '/resources/brand-assets.zip',
        tags: ['branding', 'assets', 'design'],
      },
    ];

    return NextResponse.json({ resources });

  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}