"use server";

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { getPullRequestDiff } from "@/module/github/lib/github";
import { canCreateReview, incrementReviewCount } from "@/module/payment/lib/subscription";

export async function reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
) {

    try {

        const repository = await prisma.repository.findFirst({
            where: {
                owner,
                name: repo
            },
            include: {
                user: {
                    include: {
                        accounts: {
                            where: {
                                providerId: "github"
                            }
                        }
                    }
                }
            }
        })
        if (!repository) {
            throw new Error(`Repository ${owner}/${repo} not found in database. please reconnect the repository.`)
        }

        const canReview= await canCreateReview(repository.user.id, repository.id);

        if (!canReview){
            throw new Error("You can't create a review for this repository. Please upgrade your subscription.");
        }


        const githubAccount = repository.user.accounts[0];

        if (!githubAccount?.accessToken) {
            throw new Error("NO GitHub access token found for repository owner")
        }

        const token = githubAccount.accessToken
        const { title } = await getPullRequestDiff(token, owner, repo, prNumber)

        await inngest.send({
            name: "pr.review.requested",
            data: {
                owner,
                repo,
                prNumber,
                userId: repository.user.id,
                title
            }
        })

        await incrementReviewCount(repository.user.id, repository.id)


        return { success: true, messsage: "Review queued" }
    } catch (error) {
        try {
            const repository = await prisma.repository.findFirst({
                where: { owner, name: repo }
            })
            if (repository) {
                await prisma.review.create({
                    data: {
                        repositoryId: repository.id,
                        prNumber,
                        prTitle: "failed to fetch PR ",
                        prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                        review: `Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
                        status: "Failed"
                    }
                })
            }
        } catch (dbError) {
            console.error("Failed to save error to database:", dbError)
        }
    }

}