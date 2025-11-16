"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardingSchema, type OnboardingFormData } from "../schema";

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => Promise<void>;
}

const OnboardingForm = ({ onSubmit }: OnboardingFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      dob: "",
    },
  });

  const onSubmitForm = async (data: OnboardingFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to create user. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          {...register("username")}
          disabled={isSubmitting}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input
          id="dob"
          type="date"
          {...register("dob")}
          disabled={isSubmitting}
        />
        {errors.dob && (
          <p className="text-sm text-destructive">{errors.dob.message}</p>
        )}
      </div>

      {submitError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Continue"}
      </Button>
    </form>
  );
};

export default OnboardingForm;
