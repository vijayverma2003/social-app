"use client";

import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile } from "@/services/users";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserWithProfile } from "@shared/types";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserProfileSchema,
  type UpdateUserProfileSchema,
} from "@shared/schemas/user";

interface ProfileSettingsFormProps {
  user: UserWithProfile;
}

const ProfileSettingsForm = ({ user }: ProfileSettingsFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserProfileSchema>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      bio: user.profile?.bio || "",
      pronouns: user.profile?.pronouns || "",
      bannerColor: user.profile?.bannerColor || "#4e83d9",
      avatarURL: user.profile?.avatarURL || "",
      bannerURL: user.profile?.bannerURL || "",
      profileGradientStart: user.profile?.profileGradientStart || "",
      profileGradientEnd: user.profile?.profileGradientEnd || "",
      displayName: user.profile?.displayName || "",
    },
  });

  const onSubmitForm = async (data: UpdateUserProfileSchema) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Upload images first if they were selected
      let avatarURL = data.avatarURL;
      let bannerURL = data.bannerURL;

      // Update profile with the final URLs
      await updateUserProfile(
        {
          ...data,
          avatarURL: avatarURL || "",
          bannerURL: bannerURL || "",
        },
        token
      );

      // Clear selected files after successful submission
      setSubmitSuccess(true);
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        setSubmitError(
          error.response?.data?.error ||
            "Failed to update profile. Please try again."
        );
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again."
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your display name"
          {...register("displayName")}
          disabled={isSubmitting}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">
            {errors.displayName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="pronouns">Pronouns</Label>
        <Input type="text" {...register("pronouns")} disabled={isSubmitting} />
        {errors.pronouns && (
          <p className="text-sm text-destructive">{errors.pronouns.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bannerColor">Banner Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            {...register("bannerColor")}
            disabled={isSubmitting}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="#4e83d9"
            {...register("bannerColor")}
            disabled={isSubmitting}
            className="flex-1"
          />
        </div>
        {errors.bannerColor && (
          <p className="text-sm text-destructive">
            {errors.bannerColor.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea {...register("bio")} disabled={isSubmitting} />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profileGradientStart">Profile Gradient</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="profileGradientStart"
            type="color"
            {...register("profileGradientStart")}
            disabled={isSubmitting}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            id="profileGradientEnd"
            type="color"
            {...register("profileGradientEnd")}
            disabled={isSubmitting}
            className="w-20 h-10 cursor-pointer"
          />
        </div>
        {errors.profileGradientStart && (
          <p className="text-sm text-destructive">
            {errors.profileGradientStart.message}
          </p>
        )}
        {errors.profileGradientEnd && (
          <p className="text-sm text-destructive">
            {errors.profileGradientEnd.message}
          </p>
        )}
      </div>
      {submitError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}
      {submitSuccess && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">
            Profile updated successfully!
          </p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default ProfileSettingsForm;
