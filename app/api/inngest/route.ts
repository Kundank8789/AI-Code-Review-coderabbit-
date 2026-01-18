import {inngest} from "@/inngest/client";
import { indexRepo } from "@/inngest/function";
import {serve} from "inngest/next";

export const {GET,POST,PUT}=serve({
    client:inngest,
    functions:[
        indexRepo
    ]
})