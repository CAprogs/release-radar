"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  AlertTriangle, 
  CheckCircle, 
  Github, 
  GitFork, 
  Info, 
  Loader2, 
  PlusCircle, 
  RefreshCw, 
  Star, 
  Trash2, 
  Triangle,
  Settings,
  Database,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Zap
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { Repository, ProjectSettings } from "@/lib/types";
import { 
  loadRepositories, 
  addRepository, 
  removeRepository, 
  refreshRepositories,
  analyzeReleaseImpact,
  analyzeOverallRepositoryImpact,
  loadProjectSettings,
  updateProjectSettings 
} from "@/lib/server-actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid GitHub repository URL." }),
  version: z.string().min(1, { message: "Please enter a starting version tag." }),
});

const settingsSchema = z.object({
  projectDescription: z.string().min(10, { message: "Please provide a detailed project description (at least 10 characters)." }),
  language: z.string().min(1, { message: "Please select a language." }),
});

type ImpactLevel = "high" | "medium" | "low";

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
    const impactConfig = {
        high: { icon: AlertTriangle, color: "bg-destructive text-destructive-foreground", label: "High" },
        medium: { icon: Triangle, color: "bg-accent text-accent-foreground", label: "Medium" },
        low: { icon: CheckCircle, color: "bg-primary text-primary-foreground", label: "Low" },
    };

    const { icon: Icon, color, label } = impactConfig[impact];

    return (
        <Badge className={cn("flex items-center gap-1 whitespace-nowrap text-xs", color)}>
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </Badge>
    );
}

interface RepositoryCardProps {
  repository: Repository;
  onRemove: () => void;
  onAnalyzeRelease: (releaseId: string) => void;
  onAnalyzeOverall: () => void;
  analyzingReleases: Set<string>;
  analyzingOverall: Set<string>;
}

function RepositoryCard({ 
  repository, 
  onRemove, 
  onAnalyzeRelease, 
  onAnalyzeOverall,
  analyzingReleases,
  analyzingOverall 
}: RepositoryCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showAllReleases, setShowAllReleases] = React.useState(false);
  
  const displayedReleases = showAllReleases ? repository.releases : repository.releases.slice(0, 3);
  const hasMoreReleases = repository.releases.length > 3;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Github className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{repository.name}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {repository.stars.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  {repository.forks.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {repository.releases.length} releases
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {repository.overallImpact && (
              <ImpactBadge impact={repository.overallImpact.impact} />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Overall Impact Section */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Overall Impact Analysis</span>
                  {repository.overallImpact && (
                    <ImpactBadge impact={repository.overallImpact.impact} />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAnalyzeOverall}
                  disabled={analyzingOverall.has(repository.id)}
                >
                  {analyzingOverall.has(repository.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  <span className="ml-1">Analyze</span>
                </Button>
              </div>

              {repository.overallImpact && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="text-xs text-muted-foreground">
                    {repository.overallImpact.summary}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Reason:</strong> {repository.overallImpact.reason}
                  </div>
                </div>
              )}

              {/* Releases Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recent Releases</span>
                  {hasMoreReleases && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllReleases(!showAllReleases)}
                    >
                      {showAllReleases ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Show all ({repository.releases.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <ScrollArea className={showAllReleases ? "h-64" : "h-auto"}>
                  <div className="space-y-2">
                    {displayedReleases.map((release) => (
                      <div
                        key={release.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {release.version}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(release.publishedAt), "MMM dd, yyyy")}
                            </span>
                            {release.impact && (
                              <ImpactBadge impact={release.impact} />
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAnalyzeRelease(release.id)}
                            disabled={analyzingReleases.has(release.id)}
                          >
                            {analyzingReleases.has(release.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        
                        {release.summary && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Summary:</strong> {release.summary}
                          </div>
                        )}
                        
                        {release.reason && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Impact Reason:</strong> {release.reason}
                          </div>
                        )}
                        
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View raw notes
                          </summary>
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap">
                            {release.rawNotes.length > 200 
                              ? `${release.rawNotes.substring(0, 200)}...` 
                              : release.rawNotes
                            }
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function ReleaseRadarDashboard() {
  const [repositories, setRepositories] = React.useState<Repository[]>([]);
  const [projectSettings, setProjectSettings] = React.useState<ProjectSettings | null>(null);
  const [analyzingReleases, setAnalyzingReleases] = React.useState<Set<string>>(new Set());
  const [analyzingOverall, setAnalyzingOverall] = React.useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "", version: "" },
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { 
      projectDescription: "", 
      language: "English" 
    },
  });

  // Load initial data
  React.useEffect(() => {
    async function loadInitialData() {
      try {
        const [repos, settings] = await Promise.all([
          loadRepositories(),
          loadProjectSettings(),
        ]);
        
        setRepositories(repos);
        setProjectSettings(settings);
        
        if (settings) {
          settingsForm.reset({
            projectDescription: settings.projectDescription,
            language: settings.language,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data from database",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [settingsForm, toast]);

  const handleAddRepository = async (values: z.infer<typeof formSchema>) => {
    setIsAdding(true);
    try {
      const result = await addRepository(values.url, values.version);
      
      if (result.success) {
        const updatedRepos = await loadRepositories();
        setRepositories(updatedRepos);
        form.reset();
        toast({
          title: "Repository Added",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Add Repository",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRepository = async (repoId: string) => {
    try {
      const result = await removeRepository(repoId);
      
      if (result.success) {
        const updatedRepos = await loadRepositories();
        setRepositories(updatedRepos);
        toast({
          title: "Repository Removed",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove repository",
      });
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshRepositories();
      
      if (result.success) {
        const updatedRepos = await loadRepositories();
        setRepositories(updatedRepos);
        toast({
          title: "Refresh Complete",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Refresh Failed",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh repositories",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAnalyzeRelease = async (releaseId: string, repositoryId: string) => {
    setAnalyzingReleases(prev => new Set(prev).add(releaseId));
    
    try {
      const result = await analyzeReleaseImpact(releaseId, repositoryId);
      
      if (result.success) {
        const updatedRepos = await loadRepositories();
        setRepositories(updatedRepos);
        toast({
          title: "Analysis Complete",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze release",
      });
    } finally {
      setAnalyzingReleases(prev => {
        const newSet = new Set(prev);
        newSet.delete(releaseId);
        return newSet;
      });
    }
  };

  const handleAnalyzeOverall = async (repositoryId: string) => {
    setAnalyzingOverall(prev => new Set(prev).add(repositoryId));
    
    try {
      const result = await analyzeOverallRepositoryImpact(repositoryId);
      
      if (result.success) {
        const updatedRepos = await loadRepositories();
        setRepositories(updatedRepos);
        toast({
          title: "Overall Analysis Complete",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze overall impact",
      });
    } finally {
      setAnalyzingOverall(prev => {
        const newSet = new Set(prev);
        newSet.delete(repositoryId);
        return newSet;
      });
    }
  };

  const handleUpdateSettings = async (values: z.infer<typeof settingsSchema>) => {
    try {
      const result = await updateProjectSettings(values.projectDescription, values.language);
      
      if (result.success) {
        const updatedSettings = await loadProjectSettings();
        setProjectSettings(updatedSettings);
        setShowSettings(false);
        toast({
          title: "Settings Updated",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 animate-pulse" />
          <span>Loading from database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Release Radar</h1>
            <p className="text-muted-foreground">
              Track GitHub releases and analyze their impact with AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                  <DialogDescription>
                    Configure your project description and preferences
                  </DialogDescription>
                </DialogHeader>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="projectDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your project to help AI analyze impact..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Analysis Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="Spanish">Spanish</SelectItem>
                              <SelectItem value="German">German</SelectItem>
                              <SelectItem value="Italian">Italian</SelectItem>
                              <SelectItem value="Portuguese">Portuguese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Save Settings</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh All
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {repositories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Repositories</span>
                </div>
                <div className="text-2xl font-bold">{repositories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Releases</span>
                </div>
                <div className="text-2xl font-bold">
                  {repositories.reduce((acc, repo) => acc + repo.releases.length, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Analyzed Releases</span>
                </div>
                <div className="text-2xl font-bold">
                  {repositories.reduce((acc, repo) => 
                    acc + repo.releases.filter(r => r.summary).length, 0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Overall Analyses</span>
                </div>
                <div className="text-2xl font-bold">
                  {repositories.filter(repo => repo.overallImpact).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Repository Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Repository
            </CardTitle>
            <CardDescription>
              Track a new GitHub repository and analyze its releases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddRepository)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>GitHub Repository URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://github.com/owner/repo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Version</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="v1.0.0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isAdding || !projectSettings}>
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  {isAdding ? "Adding..." : "Add Repository"}
                </Button>
                {!projectSettings && (
                  <p className="text-sm text-muted-foreground">
                    Please configure your project settings before adding repositories.
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Repositories List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Tracked Repositories ({repositories.length})
            </h2>
          </div>
          
          {repositories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No repositories tracked yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first repository to start tracking releases and analyzing their impact.
                </p>
                {!projectSettings && (
                  <p className="text-sm text-muted-foreground">
                    Don't forget to configure your project settings first!
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {repositories.map((repository) => (
                <RepositoryCard
                  key={repository.id}
                  repository={repository}
                  onRemove={() => handleRemoveRepository(repository.id)}
                  onAnalyzeRelease={(releaseId) => handleAnalyzeRelease(releaseId, repository.id)}
                  onAnalyzeOverall={() => handleAnalyzeOverall(repository.id)}
                  analyzingReleases={analyzingReleases}
                  analyzingOverall={analyzingOverall}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
