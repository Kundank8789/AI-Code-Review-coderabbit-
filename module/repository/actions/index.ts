"use server"
import prisma from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createWebhook, getRepositories } from "@/module/github/lib/github"

export const fetchRepositories = async (page: number = 1, per_page: number = 10) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error("Unauthorized");

    }
    const githubRepos = await getRepositories(page, per_page);
    const dbRepos = await prisma.repository.findMany({
        where: {
            userId: session.user.id
        },
        select: {
            githubId: true,
        }
    });
    const connectedRepoIds = new Set(dbRepos.map(repo => repo.githubId.toString()));
    return githubRepos.map((repo: any) => ({
        ...repo,
        connected: connectedRepoIds.has(repo.id),
    }));
}

export const connectRepository = async (owner: string, repo: string, githubId: number) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error("Unauthorized");
    }
    const webhooks = await createWebhook(owner, repo)
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
            }
        });
    }
    return webhooks;
} 