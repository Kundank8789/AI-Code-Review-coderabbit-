"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search } from "lucide-react";
import { useRepositories } from "@/module/repository/hooks/use-repositories";
import { RepositoryListSkeleton } from "@/module/repository/components/repository-skeleton";
import { useConnectRepository } from "@/module/repository/hooks/use-connect-repository";

type RepoFromApi = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: { login: string };
  connected: boolean;

  // optional fields (GitHub may send these but your API might not)
  description?: string | null;
  stargazers_count?: number;
  language?: string | null;
  topics?: string[];
};

const RepositoryPage = () => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRepositories();

  const { mutate: connectRepo } = useConnectRepository();

  const [searchQuery, setSearchQuery] = useState("");
  const [localConnectingId, setLocalConnectingId] = useState<number | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage and view all your GitHub repositories
          </p>
        </div>
        <RepositoryListSkeleton />
      </div>
    );
  }

  const allRepositories: RepoFromApi[] = data?.pages.flatMap((page) => page) ?? [];

  const filteredRepositories = allRepositories.filter((repo) => {
    const q = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.full_name.toLowerCase().includes(q)
    );
  });

  const handleConnect = (repo: RepoFromApi) => {
    setLocalConnectingId(repo.id);

    connectRepo(
      {
        owner: repo.full_name.split("/")[0],
        repo: repo.name,
        githubId: repo.id,
      },
      {
        onSettled: () => setLocalConnectingId(null),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredRepositories.map((repo) => (
          <Card key={repo.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{repo.name}</CardTitle>

                    <Badge variant="outline">{repo.language ?? "Unknown"}</Badge>

                    {repo.connected && (
                      <Badge variant="secondary">Connected</Badge>
                    )}
                  </div>

                  <CardDescription>
                    {repo.description ?? "No description available"}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>

                  <Button
                    onClick={() => handleConnect(repo)}
                    disabled={localConnectingId === repo.id || repo.connected}
                    variant={repo.connected ? "outline" : "default"}
                  >
                    {localConnectingId === repo.id
                      ? "Connecting..."
                      : repo.connected
                      ? "Connected"
                      : "Connect"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div ref={observerTarget} className="py-4">
        {isFetchingNextPage && <RepositoryListSkeleton />}

        {!hasNextPage && allRepositories.length > 0 && (
          <p className="text-center text-muted-foreground">No more repositories</p>
        )}
      </div>
    </div>
  );
};

export default RepositoryPage;
