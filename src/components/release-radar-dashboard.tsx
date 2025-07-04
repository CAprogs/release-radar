
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, CheckCircle, Github, GitFork, Info, Languages, Loader2, PlusCircle, RefreshCw, Star, Trash2, Triangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { Repository } from "@/lib/types";
import { analyzeRelease, analyzeOverallImpact } from "@/lib/actions";
import { validateAndFetchRepository, fetchNewReleasesForRepo } from "@/lib/github";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid GitHub repository URL." }),
  version: z.string().min(1, { message: "Please enter a starting version tag." }),
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
        <Badge className={cn("flex items-center gap-1.5 whitespace-nowrap", color)}>
            <Icon className="h-3.5 w-3.5" />
            <span>{label} Impact</span>
        </Badge>
    );
}

const MarkdownDisplay = ({ content }: { content: string }) => (
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
        </ReactMarkdown>
    </div>
);


export default function ReleaseRadarDashboard() {
  const [repositories, setRepositories] = React.useState<Repository[]>([]);
  const [projectDescription, setProjectDescription] = React.useState<string>("");
  const [language, setLanguage] = React.useState("English");
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);
  const [analyzingOverall, setAnalyzingOverall] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { toast } = useToast();
  const [overallAnalysisResult, setOverallAnalysisResult] = React.useState<({ repoName: string } & NonNullable<Repository['overallImpact']>) | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "", version: "" },
  });

  const handleAddRepository = async (values: z.infer<typeof formSchema>) => {
    setIsAdding(true);
    if (!projectDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Project Description Required",
        description: "Please provide a global project description before adding a repository.",
      });
      setIsAdding(false);
      return;
    }

    try {
        const newRepo = await validateAndFetchRepository(values.url, values.version, projectDescription);
        setRepositories(prev => [newRepo, ...prev]);
        form.reset();
        toast({
            title: "Repository Added",
            description: `${newRepo.name} is now being tracked.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to Add Repository",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsAdding(false);
    }
  };

  const handleRemoveRepository = (repoId: string) => {
    const repo = repositories.find(r => r.id === repoId);
    setRepositories(prev => prev.filter(r => r.id !== repoId));
    toast({
        title: "Repository Removed",
        description: `${repo?.name} is no longer being tracked.`,
    });
  };
  
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    let totalNewReleases = 0;
    try {
        const newReleasesPromises = repositories.map(repo => {
            const latestVersion = repo.releases[0]?.version;
            if (!latestVersion) return Promise.resolve([]);
            return fetchNewReleasesForRepo(repo.name, latestVersion);
        });

        const results = await Promise.allSettled(newReleasesPromises);

        const updatedRepositories = repositories.map((repo, index) => {
            const result = results[index];
            if (result.status === 'fulfilled' && result.value.length > 0) {
                const newReleases = result.value;
                totalNewReleases += newReleases.length;
                return {
                    ...repo,
                    releases: [...newReleases, ...repo.releases],
                };
            }
            return repo;
        });

        setRepositories(updatedRepositories);

        toast({
            title: "Refresh Complete",
            description: `Found ${totalNewReleases} new release(s).`,
        });

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Refresh Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleAnalyze = async (repoId: string, releaseId: string) => {
    const repo = repositories.find(r => r.id === repoId);
    const release = repo?.releases.find(rel => rel.id === releaseId);

    if (!release || !repo?.projectDescription.trim()) {
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Please provide a project description for this repository before analyzing.",
        });
        return;
    }

    setAnalyzing(releaseId);
    try {
        const result = await analyzeRelease(release.rawNotes, repo.projectDescription, language);
        setRepositories(prevRepos =>
            prevRepos.map(r =>
                r.id === repoId
                    ? {
                        ...r,
                        releases: r.releases.map(rel =>
                            rel.id === releaseId ? { ...rel, ...result } : rel
                        ),
                    }
                    : r
            )
        );
    } catch (error) {
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "Failed to get analysis from the AI model.",
        });
    } finally {
        setAnalyzing(null);
    }
  };

  const handleUpdateRepoDescription = (repoId: string, newDescription: string) => {
    setRepositories(prev => prev.map(repo => repo.id === repoId ? { ...repo, projectDescription: newDescription } : repo));
  };

  const handleAnalyzeOverall = async (repoId: string) => {
    const repo = repositories.find(r => r.id === repoId);
    if (!repo || !repo.projectDescription.trim() || repo.releases.length <= 1) {
      toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "A project description and at least two releases are required for an overall analysis.",
      });
      return;
    }

    setAnalyzingOverall(repoId);
    try {
      const result = await analyzeOverallImpact(repo.releases, repo.projectDescription, language);
      
      const updatedRepo = { ...repo, overallImpact: result };
      setRepositories(prev => prev.map(r => r.id === repoId ? updatedRepo : r));
      setOverallAnalysisResult({ ...result, repoName: repo.name });

    } catch (error) {
        toast({
            variant: "destructive",
            title: "AI Error",
            description: error instanceof Error ? error.message : "Failed to get overall analysis from the AI model.",
        });
    } finally {
        setAnalyzingOverall(null);
    }
  };

  return (
    <>
      <Dialog open={!!overallAnalysisResult} onOpenChange={(open) => !open && setOverallAnalysisResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Overall Impact Analysis for {overallAnalysisResult?.repoName}</DialogTitle>
            <DialogDescription>
              This is a consolidated analysis of all new releases from the initial tracked version to the latest.
            </DialogDescription>
          </DialogHeader>
          {overallAnalysisResult && (
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Overall Impact:</h3>
                <ImpactBadge impact={overallAnalysisResult.impact} />
              </div>
              <div className="p-4 bg-accent/20 rounded-md border border-accent/30">
                <h4 className="font-semibold mb-2 text-accent">AI Impact Reasoning</h4>
                <MarkdownDisplay content={overallAnalysisResult.reason} />
              </div>
              <div className="p-4 bg-primary/20 rounded-md border border-primary/30">
                <h4 className="font-semibold mb-2 text-primary">AI Consolidated Summary</h4>
                <MarkdownDisplay content={overallAnalysisResult.summary} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex flex-col min-h-svh bg-background font-body">
        <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 text-primary"/>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Release Radar</h1>
            </div>
            <Button size="sm" variant="outline" onClick={handleRefreshAll} disabled={isRefreshing || repositories.length === 0}>
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh All
            </Button>
          </div>
        </header>
        
        <main className="container mx-auto flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Setup your project and repositories to track.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                      <Label htmlFor="project-description">Global Project Description</Label>
                      <Textarea
                          id="project-description"
                          placeholder="e.g., I'm building a data visualization dashboard with React and TypeScript..."
                          value={projectDescription}
                          onChange={(e) => setProjectDescription(e.target.value)}
                          rows={4}
                          className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">This is used as the default context for new repositories.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language-select">AI Summary Language</Label>
                     <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language-select" className="w-full">
                            <Languages className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Chinese">Chinese</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div>
                      <h3 className="font-semibold mb-4">Track New Repository</h3>
                      <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleAddRepository)} className="space-y-4">
                              <FormField
                                  control={form.control}
                                  name="url"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Repository URL</FormLabel>
                                      <FormControl>
                                          <Input placeholder="https://github.com/user/repo" {...field} />
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
                                      <FormLabel>Initial Version Tag</FormLabel>
                                      <FormControl>
                                          <Input placeholder="v1.0.0" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              <Button type="submit" className="w-full" disabled={isAdding}>
                                  {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                  Add Repository
                              </Button>
                          </form>
                      </Form>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {repositories.length === 0 && !isAdding ? (
                   <Card className="flex items-center justify-center h-48">
                      <CardContent className="p-6 text-center">
                          <p className="text-lg font-medium text-muted-foreground">No repositories tracked yet.</p>
                          <p className="text-sm text-muted-foreground">Use the form to add a repository and start tracking releases.</p>
                      </CardContent>
                   </Card>
                ) : null}
                <AnimatePresence>
                {repositories.map(repo => (
                  <motion.div key={repo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }} layout>
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Github className="h-8 w-8 text-muted-foreground flex-shrink-0"/>
                              <div className="min-w-0">
                                <CardTitle className="text-2xl font-bold truncate">{repo.name}</CardTitle>
                                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block">{repo.url}</a>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-2 text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500"/> {repo.stars.toLocaleString('en-US')}</span>
                                    <span className="flex items-center gap-1.5"><GitFork className="h-4 w-4 "/> {repo.forks.toLocaleString('en-US')}</span>
                                    <span className="flex items-center gap-1.5"><Info className="h-4 w-4"/> 
                                        {repo.releases.length} new releases since {repo.releases[repo.releases.length - 1]?.version}
                                    </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button 
                                  size="sm"
                                  onClick={() => handleAnalyzeOverall(repo.id)}
                                  disabled={analyzingOverall === repo.id || repo.releases.length <=1}>
                                  {analyzingOverall === repo.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Analyze Upgrade
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveRepository(repo.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove Repository</span>
                              </Button>
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-6">
                            <Label htmlFor={`project-description-${repo.id}`}>Project Context for <span className="font-semibold">{repo.name}</span></Label>
                            <Textarea
                                id={`project-description-${repo.id}`}
                                placeholder="e.g., I'm using this library for my e-commerce checkout page..."
                                value={repo.projectDescription}
                                onChange={(e) => handleUpdateRepoDescription(repo.id, e.target.value)}
                                rows={3}
                                className="text-base"
                            />
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          {repo.releases.map(release => (
                              <AccordionItem value={release.id} key={release.id}>
                                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                                      <div className="flex items-center justify-between w-full pr-4">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                            <span>Version: {release.version}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(release.publishedAt), 'PPP')}</span>
                                          </div>
                                          {release.impact && <ImpactBadge impact={release.impact} />}
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-2 pb-4 space-y-4">
                                      <div className="p-4 bg-secondary/50 rounded-md border">
                                        <h4 className="font-semibold mb-2 text-foreground">Original Release Notes</h4>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.rawNotes}</ReactMarkdown>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end">
                                          <Button 
                                              onClick={() => handleAnalyze(repo.id, release.id)} 
                                              disabled={!repo.projectDescription.trim() || analyzing === release.id}
                                          >
                                              {analyzing === release.id ? (
                                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              ) : null}
                                              Analyze Impact
                                          </Button>
                                      </div>
                                      <AnimatePresence>
                                      {release.summary && (
                                          <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                            className="space-y-4 overflow-hidden"
                                          >
                                              <Separator />
                                              <div className="p-4 bg-card rounded-md border border-primary/20 shadow-sm">
                                                <h4 className="font-semibold mb-2 text-primary">AI Summary</h4>
                                                <MarkdownDisplay content={release.summary} />
                                              </div>
                                               <div className="p-4 bg-card rounded-md border border-accent/20 shadow-sm">
                                                <h4 className="font-semibold mb-2 text-accent">AI Impact Analysis</h4>
                                                <MarkdownDisplay content={release.reason || ""} />
                                              </div>
                                          </motion.div>
                                      )}
                                      </AnimatePresence>
                                  </AccordionContent>
                              </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
