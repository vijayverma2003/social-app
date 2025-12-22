"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom/date-picker";
import { createUserSchema, type CreateUserSchema } from "@shared/schemas/user";
import { createUser } from "@/services/users";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

const OnboardingForm = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      dob: new Date(),
    },
  });

  const dobValue = watch("dob");

  const handleDateChange = (date: Date) => {
    setValue("dob", date, { shouldValidate: true });
  };

  const onSubmitForm = async (data: CreateUserSchema) => {
    setSubmitError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      await createUser(data, token);
      router.push("/home");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        router.push("/home");
      } else if (error instanceof AxiosError)
        setSubmitError(
          error.response?.data.error ||
            "Failed to create user. Please try again."
        );
      else setSubmitError("Failed to create user. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          {...register("username")}
          disabled={isSubmitting}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth</Label>
        <DatePicker
          id="dob"
          value={dobValue}
          onChange={handleDateChange}
          disabled={isSubmitting}
          placeholder="Pick a date"
          maxDate={new Date()}
        />
        <input type="hidden" {...register("dob")} />
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
