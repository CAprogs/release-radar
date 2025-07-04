"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle, CheckCircle, Github, GitFork, Loader2, PlusCircle, RefreshCw, Star, Triangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { Repository, Release } from "@/lib/types";
import { analyzeRelease } from "@/lib/actions";
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

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid GitHub repository URL." }),
  version: z.string().min(1, { message: "Please enter a starting version tag." }),
});

const initialRepositories: Repository[] = [
  {
    id: "1",
    name: "shadcn/ui",
    url: "https://github.com/shadcn/ui",
    stars: 50000,
    forks: 2000,
    releases: [
      { id: "1-1", version: "v0.8.0", rawNotes: "Added new components: Resizable, Sonner. Improved dark mode support. Fixed 50+ bugs." },
      { id: "1-2", version: "v0.7.1", rawNotes: "Performance improvements for Chart components. Bug fixes for date picker." },
    ],
  },
  {
    id: "2",
    name: "tailwindlabs/tailwindcss",
    url: "https://github.com/tailwindlabs/tailwindcss",
    stars: 80000,
    forks: 4000,
    releases: [
        { id: "2-1", version: "v3.4.1", rawNotes: "Fixes an issue where `backdrop-blur` wasn't working with `border-collapse`." },
        { id: "2-2", version: "v3.4.0", rawNotes: "Adds new `svh`, `lvh` and `dvh` variants for full-height layouts. Introduces `has-*` variants for `:has(...)` pseudo-class." },
    ],
  },
];

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


export default function ReleaseRadarDashboard() {
  const [repositories, setRepositories] = React.useState<Repository[]>(initialRepositories);
  const [projectDescription, setProjectDescription] = React.useState<string>("");
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "", version: "" },
  });

  const handleAddRepository = (values: z.infer<typeof formSchema>) => {
    const repoName = new URL(values.url).pathname.substring(1);
    const newRepo: Repository = {
      id: Date.now().toString(),
      name: repoName,
      url: values.url,
      stars: 0,
      forks: 0,
      releases: [{ id: `${Date.now()}-1`, version: values.version, rawNotes: `Release notes from ${values.version} will be tracked here.` }],
    };
    setRepositories(prev => [newRepo, ...prev]);
    form.reset();
    toast({
        title: "Repository Added",
        description: `${repoName} is now being tracked.`,
    })
  };

  const handleAnalyze = async (repoId: string, releaseId: string) => {
    const repo = repositories.find(r => r.id === repoId);
    const release = repo?.releases.find(rel => rel.id === releaseId);

    if (!release || !projectDescription.trim()) {
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Please provide a project description before analyzing a release.",
        });
        return;
    }

    setAnalyzing(releaseId);
    try {
        const result = await analyzeRelease(release.rawNotes, projectDescription);
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

  return (
    <div className="flex flex-col min-h-svh bg-background font-body">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary"/>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Release Radar</h1>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
              toast({ title: "Refreshing...", description: "Checking for new releases."})
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
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
                    <Label htmlFor="project-description">Your Project Description</Label>
                    <Textarea
                        id="project-description"
                        placeholder="e.g., I'm building a data visualization dashboard with React and TypeScript..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={5}
                        className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">Describe your project for more accurate impact analysis.</p>
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
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
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
              <AnimatePresence>
              {repositories.map(repo => (
                <motion.div key={repo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Github className="h-8 w-8 text-muted-foreground"/>
                            <div>
                              <CardTitle className="text-2xl font-bold">{repo.name}</CardTitle>
                              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">{repo.url}</a>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500"/> {repo.stars.toLocaleString('en-US')}</span>
                            <span className="flex items-center gap-1"><GitFork className="h-4 w-4 text-muted-foreground"/> {repo.forks.toLocaleString('en-US')}</span>
                          </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {repo.releases.map(release => (
                            <AccordionItem value={release.id} key={release.id}>
                                <AccordionTrigger className="text-lg font-medium hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-4">
                                        <span>Version: {release.version}</span>
                                        {release.impact && <ImpactBadge impact={release.impact} />}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                    <div className="p-4 bg-secondary/50 rounded-md border">
                                      <h4 className="font-semibold mb-2 text-foreground">Original Release Notes</h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{release.rawNotes}</p>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <Button 
                                            onClick={() => handleAnalyze(repo.id, release.id)} 
                                            disabled={!projectDescription.trim() || analyzing === release.id}
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
                                              <p className="text-sm text-foreground whitespace-pre-wrap">{release.summary}</p>
                                            </div>
                                             <div className="p-4 bg-card rounded-md border border-accent/20 shadow-sm">
                                              <h4 className="font-semibold mb-2 text-accent">AI Impact Analysis</h4>
                                              <p className="text-sm text-foreground whitespace-pre-wrap">{release.reason}</p>
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
  );
}
