"use client";

import OnboardingForm from "@/features/onboarding/components/OnboardingForm";

const Onboarding = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-accent/50 rounded-2xl p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Let's get to know you better
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
};

export default Onboarding;
