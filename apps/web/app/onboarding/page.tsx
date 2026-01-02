"use client";

import OnboardingForm from "@/app/onboarding/components/OnboardingForm";

const Onboarding = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-accent/50 rounded-xl p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Complete Your Profile</h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Let&apos;s get to know you better
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
};

export default Onboarding;
