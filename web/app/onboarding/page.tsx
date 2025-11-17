"use client";

import { useAuth } from "@clerk/nextjs";
import OnboardingForm from "@/features/onboarding/components/OnboardingForm";
import type { OnboardingFormData } from "../../../shared/schemas/user";
import UserService from "@/services/users";
import { useRouter } from "next/navigation";

const Onboarding = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const handleSubmit = async (data: OnboardingFormData) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await UserService.createUser(data, token);

      console.log(response);

      router.push("/home");
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.response?.status === 409) {
        // User already exists, redirect to home
        router.push("/home");
      } else {
        console.error("Error creating user:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-accent/50 rounded-2xl p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Let's get to know you better
          </p>
        </div>

        <OnboardingForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default Onboarding;
