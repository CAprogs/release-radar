import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.release.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.projectSettings.deleteMany();

  // Create default project settings
  const projectSettings = await prisma.projectSettings.create({
    data: {
      projectDescription: 'A modern web application tracking GitHub releases and their impact analysis using AI.',
      language: 'English',
    },
  });

  console.log('✅ Created project settings:', projectSettings.id);

  // Create sample repository
  const sampleRepo = await prisma.repository.create({
    data: {
      name: 'vercel/next.js',
      url: 'https://github.com/vercel/next.js',
      stars: 120000,
      forks: 26000,
      projectDescription: 'A modern web application tracking GitHub releases and their impact analysis using AI.',
      releases: {
        create: [
          {
            version: 'v15.3.3',
            publishedAt: new Date('2024-12-15T10:00:00Z'),
            rawNotes: 'Bug fixes and performance improvements for App Router stability.',
            summary: 'Minor bug fixes and performance optimizations',
            impact: 'low',
            reason: 'This release contains only bug fixes and minor performance improvements, unlikely to impact existing functionality.',
          },
          {
            version: 'v15.3.0',
            publishedAt: new Date('2024-12-01T10:00:00Z'),
            rawNotes: 'Major improvements to the App Router, new experimental features, and breaking changes to the API.',
            summary: 'Major App Router improvements with breaking changes',
            impact: 'high',
            reason: 'Contains breaking changes to the API that may require code modifications.',
          },
        ],
      },
    },
    include: {
      releases: true,
    },
  });

  console.log('✅ Created sample repository:', sampleRepo.id);
  console.log('✅ Created', sampleRepo.releases.length, 'sample releases');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
