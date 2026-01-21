import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import  {polarClient}  from "@/module/payment/config/polar";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { updateUserTier } from "@/module/payment/lib/subscription";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["repo"],
    },
  },

  trustedOrigins: [
    "https://min-recent-spiritedly.ngrok-free.dev",
  ],

  cookies: {
    secure: true,
    sameSite: "none",

    // 🔥 THIS IS THE MISSING PIECE
    domain: "min-recent-spiritedly.ngrok-free.dev",
  },
  plugins: [
       polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "c3069a99-ef72-4318-b618-18493969acc5",
                            slug: "code-rabbit" // Custom slug for easy reference in Checkout URL, e.g. /checkout/code-rabbit
                        }
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL,
                    authenticatedUsersOnly: true
                }),
                portal({
                  returnUrl: process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000/dashboard"
                }),
                usage(),
                webhooks({
                  secret:process.env.POLAR_WEBHOOK_SECRET!,
                  onSubscriptionActive:async (payload) => {
                    const customerId = payload.data.customerId;

                    const user = await prisma.user.findUnique({
                      where:{
                        polarCustomerId :customerId
                      }
                    });
                    if (user){
                      await updateUserTier(user.id,"PRO","ACTIVE", )
                    }
                  },
                  onSubscriptionCanceled:async (payload) => {
                    const customerId = payload.data.customerId;

                    const user = await prisma.user.findUnique({
                      where:{
                        polarCustomerId :customerId
                      }
                    });
                    if (user){
                      await updateUserTier(user.id,"FREE","CANCLED" )
                    }
                  },
                  onSubscriptionRevoked:async (payload) => {
                    const customerId = payload.data.customerId;

                    const user = await prisma.user.findUnique({
                      where:{
                        polarCustomerId :customerId
                      }
                    });
                    if (user){
                      await updateUserTier(user.id,"FREE","EXPIRED", )
                    }
                  },
                  onOrderPaid:async (payload) => {
                    const customerId = payload.data.customerId;

                    const user = await prisma.user.findUnique({
                      where:{
                        polarCustomerId :customerId
                      }
                    });
                    if (user){
                      await updateUserTier(user.id,"PRO","ACTIVE", )
                    }
                  },
                  onCustomerCreated:async (payload) => {
                    const customerId = payload.data.id;

                    const user = await prisma.user.findUnique({
                      where:{
                        polarCustomerId :customerId
                      }
                    });
                    if (user){
                      await updateUserTier(user.id,"PRO","ACTIVE", )
                    }
                  }
                })
            ],
        })
  ],
  
  debug: true,
});
