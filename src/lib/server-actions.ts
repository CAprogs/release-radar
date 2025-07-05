'use server';

import { revalidatePath } from 'next/cache';
import { 
  createRepository, 
  getAllRepositories, 
  deleteRepository as dbDeleteRepository,
  updateRelease,
  addReleasesToRepository,
  updateRepositoryOverallImpact,
  getProjectSettings,
  updateProjectSettings as dbUpdateProjectSettings
} from './database';
import { validateAndFetchRepository as githubFetchRepository, fetchNewReleasesForRepo } from './github';
import { analyzeRelease as aiAnalyzeRelease, analyzeOverallImpact as aiAnalyzeOverallImpact } from './actions';
import type { Repository, Release, ImpactLevel } from './types';

export async function loadRepositories(): Promise<Repository[]> {
  try {
    return await getAllRepositories();
  } catch (error) {
    console.error('Error loading repositories:', error);
    return [];
  }
}

export async function addRepository(url: string, version: string): Promise<{ success: boolean; message: string; repository?: Repository }> {
  try {
    // Get project settings
    const settings = await getProjectSettings();
    if (!settings || !settings.projectDescription.trim()) {
      return {
        success: false,
        message: 'Please set up your project description in settings before adding repositories.',
      };
    }

    // Fetch repository data from GitHub
    const githubRepo = await githubFetchRepository(url, version, settings.projectDescription);
    
    // Save to database
    const repository = await createRepository({
      name: githubRepo.name,
      url: githubRepo.url,
      stars: githubRepo.stars,
      forks: githubRepo.forks,
      projectDescription: githubRepo.projectDescription,
      releases: githubRepo.releases,
    });

    revalidatePath('/');
    return {
      success: true,
      message: `Successfully added ${repository.name}`,
      repository,
    };
  } catch (error) {
    console.error('Error adding repository:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add repository',
    };
  }
}

export async function removeRepository(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await dbDeleteRepository(id);
    revalidatePath('/');
    return {
      success: true,
      message: 'Repository removed successfully',
    };
  } catch (error) {
    console.error('Error removing repository:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove repository',
    };
  }
}

export async function refreshRepositories(): Promise<{ success: boolean; message: string; newReleasesCount?: number }> {
  try {
    const repositories = await getAllRepositories();
    let totalNewReleases = 0;

    for (const repo of repositories) {
      if (repo.releases.length === 0) continue;
      
      const latestVersion = repo.releases[0].version;
      try {
        const newReleases = await fetchNewReleasesForRepo(repo.name, latestVersion);
        if (newReleases.length > 0) {
          await addReleasesToRepository(repo.id, newReleases);
          totalNewReleases += newReleases.length;
        }
      } catch (error) {
        console.error(`Error refreshing ${repo.name}:`, error);
        // Continue with other repositories
      }
    }

    revalidatePath('/');
    return {
      success: true,
      message: `Found ${totalNewReleases} new release(s)`,
      newReleasesCount: totalNewReleases,
    };
  } catch (error) {
    console.error('Error refreshing repositories:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to refresh repositories',
    };
  }
}

export async function analyzeReleaseImpact(
  releaseId: string, 
  repositoryId: string
): Promise<{ success: boolean; message: string; analysis?: { summary: string; impact: ImpactLevel; reason: string } }> {
  try {
    const repositories = await getAllRepositories();
    const repo = repositories.find(r => r.id === repositoryId);
    const release = repo?.releases.find(r => r.id === releaseId);
    
    if (!release || !repo) {
      return {
        success: false,
        message: 'Release or repository not found',
      };
    }

    // Get project settings for language preference
    const settings = await getProjectSettings();
    const language = settings?.language || 'English';

    // Analyze with AI
    const analysis = await aiAnalyzeRelease(release.rawNotes, repo.projectDescription, language);
    
    // Update in database
    const updatedRelease = await updateRelease(releaseId, analysis);

    revalidatePath('/');
    return {
      success: true,
      message: 'Analysis completed successfully',
      analysis: {
        summary: analysis.summary || '',
        impact: analysis.impact || 'low',
        reason: analysis.reason || '',
      },
    };
  } catch (error) {
    console.error('Error analyzing release:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze release',
    };
  }
}

export async function analyzeOverallRepositoryImpact(
  repositoryId: string
): Promise<{ success: boolean; message: string; analysis?: { summary: string; impact: ImpactLevel; reason: string } }> {
  try {
    const repositories = await getAllRepositories();
    const repo = repositories.find(r => r.id === repositoryId);
    
    if (!repo) {
      return {
        success: false,
        message: 'Repository not found',
      };
    }

    // Get project settings for language preference
    const settings = await getProjectSettings();
    const language = settings?.language || 'English';

    // Prepare releases for overall analysis (use rawNotes, not summaries)
    const releases = repo.releases.map(r => ({
      version: r.version,
      rawNotes: r.rawNotes,
    }));

    if (releases.length === 0) {
      return {
        success: false,
        message: 'No releases found for analysis.',
      };
    }

    // Analyze with AI
    const analysis = await aiAnalyzeOverallImpact(releases, repo.projectDescription, language);
    
    // Update in database
    await updateRepositoryOverallImpact(repositoryId, analysis.summary, analysis.impact, analysis.reason);

    revalidatePath('/');
    return {
      success: true,
      message: 'Overall analysis completed successfully',
      analysis,
    };
  } catch (error) {
    console.error('Error analyzing overall impact:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze overall impact',
    };
  }
}

export async function loadProjectSettings() {
  try {
    return await getProjectSettings();
  } catch (error) {
    console.error('Error loading project settings:', error);
    return null;
  }
}

export async function updateProjectSettings(
  projectDescription: string, 
  language: string = 'English'
): Promise<{ success: boolean; message: string }> {
  try {
    await dbUpdateProjectSettings(projectDescription, language);
    revalidatePath('/');
    return {
      success: true,
      message: 'Project settings updated successfully',
    };
  } catch (error) {
    console.error('Error updating project settings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update project settings',
    };
  }
}
