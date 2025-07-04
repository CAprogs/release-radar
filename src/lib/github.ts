
'use server';

import type { Repository, Release } from './types';

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    const [owner, repo] = pathParts;
    return { owner, repo };
  } catch (error) {
    return null;
  }
}

export async function validateAndFetchRepository(
  url: string,
  startVersion: string,
  projectDescription: string
): Promise<Repository> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL format.');
  }
  const { owner, repo } = parsed;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository not found at ${url}`);
    }
    throw new Error(`Failed to fetch repository data. Status: ${repoRes.status}`);
  }
  const repoData = await repoRes.json();

  const releasesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
    next: { revalidate: 3600 },
  });

  if (!releasesRes.ok) {
    throw new Error('Failed to fetch releases for the repository.');
  }
  const allReleasesData: any[] = await releasesRes.json();
  if (!Array.isArray(allReleasesData) || allReleasesData.length === 0) {
    throw new Error('No releases found for this repository.');
  }

  const startIndex = allReleasesData.findIndex(r => r.tag_name === startVersion);
  if (startIndex === -1) {
    throw new Error(`Version tag "${startVersion}" not found in the latest 30 releases.`);
  }

  const releasesSinceStart = allReleasesData.slice(0, startIndex + 1);

  return {
    id: repoData.id.toString(),
    name: repoData.full_name,
    url: repoData.html_url,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    releases: releasesSinceStart.map((rel: any) => ({
      id: rel.id.toString(),
      version: rel.tag_name,
      publishedAt: rel.published_at,
      rawNotes: rel.body || 'No release notes provided.',
    })),
    projectDescription,
  };
}

export async function fetchNewReleasesForRepo(
  repoName: string,
  latestKnownVersion: string
): Promise<Release[]> {
  const [owner, repo] = repoName.split('/');
  const releasesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
    next: { revalidate: 600 }, // Cache for 10 minutes
  });

  if (!releasesRes.ok) {
    throw new Error(`Failed to fetch new releases for ${repoName}.`);
  }

  const allReleasesData: any[] = await releasesRes.json();
  const latestKnownIndex = allReleasesData.findIndex(r => r.tag_name === latestKnownVersion);

  if (latestKnownIndex === 0 || latestKnownIndex === -1) {
    return [];
  }

  const newReleasesData = allReleasesData.slice(0, latestKnownIndex);

  return newReleasesData.map((rel: any) => ({
    id: rel.id.toString(),
    version: rel.tag_name,
    publishedAt: rel.published_at,
    rawNotes: rel.body || 'No release notes provided.',
  }));
}
