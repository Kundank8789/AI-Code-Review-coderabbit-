import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export const getGithubToken = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error("Not authenticated");
    }
    const account = await prisma.account.findUnique({
        where: {
            userId: session.user.id,
            providerId: "github"
        }
    })
    if (!account) {
        throw new Error(" No GitHub access token found");
    }
    return account.accessToken;
}

export async function fetchUserContribution(token: string, username: string) {
    const octokit = new Octokit({ auth: token });
    const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
            contributionCalendar {
                totalContributions{
                    weeks{
                        contributionDays{
                        contributionCount
                        date
                        color
                        }
                    }
                }
            }
        }
      }
    }`;



    try {
        const response: any = await octokit.graphql(query, { username });
        return response.user.contributionsCollection.contributionCalendar
    } catch (error) {
        console.error("Error fetching user contributions:", error);

    }
}
