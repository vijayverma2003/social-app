import prisma from "@database/postgres";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { NEXT_PUBLIC_API_URL } from "../config/vars";

const frontendOrigin = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

const logEmail = async (params: {
  to: string;
  subject: string;
  text: string;
}) => {
  if (process.env.NODE_ENV === "production") {
    // Integrate a real email provider (Resend, SES, etc.) here.
  }

  // Fallback / dev behavior
  // eslint-disable-next-line no-console
  console.log("[auth email]", params);
};

export const auth = betterAuth({
  onAPIError: {
    onError: (error) => {
      console.error(error);
    },
  },
  baseURL: NEXT_PUBLIC_API_URL + "/v1/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: [frontendOrigin],
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, _request) => {
      await logEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 64,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, _request) => {
      await logEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
});
