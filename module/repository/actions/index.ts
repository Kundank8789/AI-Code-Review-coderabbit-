"use server"
import prisma from "@/lib/db"
import {auth} from "@/lib/auth"
import {headers} from "next/headers"
import { getRepositories } from "@/module/github/lib/github"

export const fetchRepositories = async (page:number=1, per_page:number=10) => {
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
        select:{
            githubId: true,
        }
    });
    const connectedRepoIds = new Set(dbRepos.map(repo => repo.githubId.toString()));
    return githubRepos.map((repo: any) => ({
        ...repo,
        connected: connectedRepoIds.has(repo.id)
    }));
}