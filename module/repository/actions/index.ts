"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createWebhook, getRepositories } from "@/module/github/lib/github";
import { inngest } from "@/inngest/client";
import {
  canConnectRepository,
  incrementRepositoryCount,
} from "@/module/payment/lib/subscription";

/* ✅ Type for GitHub repository response */
type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: {
    login: string;
  };
};

export const fetchRepositories = async (
  page: number = 1,
  per_page: number = 10
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const githubRepos = (await getRepositories(page, per_page)) as GithubRepo[];

  const dbRepos = await prisma.repository.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      githubId: true,
    },
  });

  const connectedRepoIds = new Set(
    dbRepos.map((repo) => repo.githubId.toString())
  );

  return githubRepos.map((repo) => ({
    ...repo,
    connected: connectedRepoIds.has(repo.id.toString()), // ✅ fixed
  }));
};

export const connectRepository = async (
  owner: string,
  repo: string,
  githubId: number
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const canConnect = await canConnectRepository(session.user.id);

  if (!canConnect) {
    throw new Error("Repository limit reached. Please upgrade your subscription.");
  }

  const webhooks = await createWebhook(owner, repo);

  if (webhooks) {
    await prisma.repository.upsert({
      where: {
        githubId: BigInt(githubId),
      },
      update: {}, // no update needed for now
      create: {
        githubId: BigInt(githubId),
        name: repo,
        owner,
        fullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        userId: session.user.id,
      },
    });

    await incrementRepositoryCount(session.user.id);

    try {
      await inngest.send({
        name: "repository.connected",
        data: {
          owner,
          repo,
          userId: session.user.id,
        },
      });
    } catch (error) {
      console.error("failed to trigger repository indexing:", error);
    }
  }

  return webhooks;
};
