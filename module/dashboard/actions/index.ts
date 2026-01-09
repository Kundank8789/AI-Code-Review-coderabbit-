"use server"

import {
    fetchUserContribution, getGithubToken
} from "@/module/github/lib/github";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import prisma from "@/lib/db";

export async function getDashboardStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        if (!session) {
            throw new Error("Unauthorized");
        }
        const token = await getGithubToken();
        const octokit = new Octokit({ auth: token });
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const totalRepos = 30

        const calender = await fetchUserContribution(token, user.login);
        const toatlCommits = calender?.totalContributions || 0;
        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr`,
            per_page: 1
        })
        const totalPRs = prs.total_count || 0;

        const totalReview = 44
        return {
            totalReview,
            totalPRs,
            totalRepos,
            toatlCommits
        }
    } catch (error) {
        console.log("Error fetching dashboard stats:", error);
        return {
            totalReview: 0,
            totalPRs: 0,
            totalRepos: 0,
            toatlCommits: 0

        }
    }
}

export async function getMonthlyActivity() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        if (!session) {
            throw new Error("Unauthorized");
        }
        const token = await getGithubToken();
        const octokit = new Octokit({ auth: token });
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const calender = await fetchUserContribution(token, user.login);
        if (!calender) {
            return []
        }
        const monthlyData: {
            [key: string]: { commits: number, prs: number; reviews: number }
        } = {}
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = { commits: 0, prs: 0, reviews: 0 };
        }
        calender.weeks.forEach((week: any) => {
            week.contributionDays.forEach((day: any) => {
                const date = new Date(day.date);
                const monthKey = monthNames[date.getMonth()];
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].commits += day.contributionCount;
                }
            });

        })

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const generateSampleReviews = () => {
            const sampleReviews = [];
            const now = new Date();
            for (let i = 0; i <= 45; i++) {
                const randomDaysAgo = Math.floor(Math.random() * 180);
                const reviewDate = new Date(now);
                reviewDate.setDate(now.getDate() - randomDaysAgo);
                sampleReviews.push({
                    createdAt: reviewDate
                })
            }
            return sampleReviews;
        };
        const reviews = generateSampleReviews();
        reviews.forEach((review) => {
            const monthKey = monthNames[review.createdAt.getMonth()];
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1;
            }
        })
        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr created:>=${sixMonthsAgo.toISOString().split('T')[0]}`,
            per_page: 100,
        })
        prs.items.forEach((pr: any) => {
            const data = new Date(pr.created_at);
            const monthKey = monthNames[data.getMonth()];
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1;
            }
        })
        return Object.keys(monthlyData).map((name) => ({
            name,
            ...monthlyData[name]
        }))
    } catch (error) {
        console.error("Error fetching monthly activity:", error);
        return [];
    }
}

