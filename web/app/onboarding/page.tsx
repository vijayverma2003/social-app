"use client";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import OnboardingForm from "@/features/onboarding/components/OnboardingForm";
import type { OnboardingFormData } from "@/features/onboarding/schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const Onboarding = () => {
  const { getToken } = useAuth();

  const handleSubmit = async (data: OnboardingFormData) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.post(
        `${API_BASE_URL}/users/create`,
        {
          username: data.username,
          dob: data.dob,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("User created successfully", response);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.response?.status === 409) {
        // User already exists, redirect to home
        console.log("User already exists: 409");
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
