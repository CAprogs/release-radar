import prisma from './prisma';
import type { Repository, Release, ImpactLevel, ProjectSettings } from './types';

// Repository CRUD operations
export async function createRepository(data: {
  name: string;
  url: string;
  stars: number;
  forks: number;
  projectDescription: string;
  releases: Omit<Release, 'id' | 'repositoryId'>[];
}): Promise<Repository> {
  const repository = await prisma.repository.create({
    data: {
      name: data.name,
      url: data.url,
      stars: data.stars,
      forks: data.forks,
      projectDescription: data.projectDescription,
      releases: {
        create: data.releases.map(release => ({
          version: release.version,
          publishedAt: new Date(release.publishedAt),
          rawNotes: release.rawNotes,
          summary: release.summary,
          impact: release.impact,
          reason: release.reason,
        })),
      },
    },
    include: {
      releases: {
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  return transformRepositoryFromDB(repository);
}

export async function getAllRepositories(): Promise<Repository[]> {
  const repositories = await prisma.repository.findMany({
    include: {
      releases: {
        orderBy: { publishedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return repositories.map(transformRepositoryFromDB);
}

export async function getRepositoryById(id: string): Promise<Repository | null> {
  const repository = await prisma.repository.findUnique({
    where: { id },
    include: {
      releases: {
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  return repository ? transformRepositoryFromDB(repository) : null;
}

export async function updateRepository(
  id: string,
  data: Partial<Pick<Repository, 'stars' | 'forks' | 'projectDescription'>>
): Promise<Repository> {
  const repository = await prisma.repository.update({
    where: { id },
    data: {
      stars: data.stars,
      forks: data.forks,
      projectDescription: data.projectDescription,
    },
    include: {
      releases: {
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  return transformRepositoryFromDB(repository);
}

export async function updateRepositoryOverallImpact(
  id: string,
  summary: string,
  impact: ImpactLevel,
  reason: string
): Promise<Repository> {
  const repository = await prisma.repository.update({
    where: { id },
    data: {
      overallSummary: summary,
      overallImpact: impact,
      overallReason: reason,
    },
    include: {
      releases: {
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  return transformRepositoryFromDB(repository);
}

export async function deleteRepository(id: string): Promise<void> {
  await prisma.repository.delete({
    where: { id },
  });
}

// Release operations
export async function addReleasesToRepository(
  repositoryId: string,
  releases: Omit<Release, 'id' | 'repositoryId'>[]
): Promise<Release[]> {
  const createdReleases = await prisma.release.createMany({
    data: releases.map(release => ({
      repositoryId,
      version: release.version,
      publishedAt: new Date(release.publishedAt),
      rawNotes: release.rawNotes,
      summary: release.summary,
      impact: release.impact,
      reason: release.reason,
    })),
  });

  // Fetch the created releases to return them
  const newReleases = await prisma.release.findMany({
    where: {
      repositoryId,
      version: { in: releases.map(r => r.version) },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return newReleases.map(transformReleaseFromDB);
}

export async function updateRelease(
  id: string,
  data: {
    summary?: string;
    impact?: ImpactLevel;
    reason?: string;
  }
): Promise<Release> {
  const release = await prisma.release.update({
    where: { id },
    data: {
      summary: data.summary,
      impact: data.impact,
      reason: data.reason,
    },
  });

  return transformReleaseFromDB(release);
}

// Project Settings operations
export async function getProjectSettings(): Promise<ProjectSettings | null> {
  const settings = await prisma.projectSettings.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  return settings ? {
    id: settings.id,
    projectDescription: settings.projectDescription,
    language: settings.language,
  } : null;
}

export async function updateProjectSettings(
  projectDescription: string,
  language: string = 'English'
): Promise<ProjectSettings> {
  // Delete existing settings and create new ones to ensure only one record
  await prisma.projectSettings.deleteMany({});
  
  const settings = await prisma.projectSettings.create({
    data: {
      projectDescription,
      language,
    },
  });

  return {
    id: settings.id,
    projectDescription: settings.projectDescription,
    language: settings.language,
  };
}

// Helper functions to transform database objects to frontend types
function transformRepositoryFromDB(repo: any): Repository {
  return {
    id: repo.id,
    name: repo.name,
    url: repo.url,
    stars: repo.stars,
    forks: repo.forks,
    projectDescription: repo.projectDescription,
    releases: repo.releases.map(transformReleaseFromDB),
    overallImpact: repo.overallSummary ? {
      summary: repo.overallSummary,
      impact: repo.overallImpact,
      reason: repo.overallReason,
    } : undefined,
  };
}

function transformReleaseFromDB(release: any): Release {
  return {
    id: release.id,
    version: release.version,
    publishedAt: release.publishedAt.toISOString(),
    rawNotes: release.rawNotes,
    summary: release.summary,
    impact: release.impact,
    reason: release.reason,
    repositoryId: release.repositoryId,
  };
}
