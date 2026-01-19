import { reviewPullRequest } from "@/module/ai/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const event = req.headers.get("x-github-event");
        console.log(`Received GitHub webhook event:, ${event}`);
        if (event === "ping") {
            return NextResponse.json({ message: "pong" }, { status: 200 });
        }
        if (event==="pull_request"){
            const action=body.action;
            const repo=body.repository.full_name;
            const prNumber=body.number;

            const [owner,repoName]=repo.split("/")

            if (action==="opened" || action === "synchronize"){
                reviewPullRequest(owner,repoName,prNumber)
                .then(()=>console.log(`Review completed for ${repo} #${prNumber}`))
                .catch((error)=>console.log(`Review failrd for ${repo} #${prNumber}:`,error))
            }
        }
        return NextResponse.json({ message: "Event process" }, { status: 200 });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}