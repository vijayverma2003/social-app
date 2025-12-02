"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/services/users";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserProfileSchema,
  type UpdateUserProfileSchema,
} from "@shared/schemas/user";
import { UserWithProfileResponse } from "@shared/types";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ProfileSettingsFormProps {
  user: UserWithProfileResponse;
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

      await updateUserProfile(data, token);
      setSubmitSuccess(true);
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        setSubmitError(
          error.response?.data?.error ||
            "Failed to update profile. Please try again."
        );
      } else {
        setSubmitError("Failed to update profile. Please try again.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="mt-4 space-y-4 max-w-lg"
    >
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
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={4}
          placeholder="Tell us about yourself..."
          {...register("bio")}
          disabled={isSubmitting}
          className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pronouns">Pronouns</Label>
        <Input
          id="pronouns"
          type="text"
          placeholder="e.g., they/them, she/her, he/him"
          {...register("pronouns")}
          disabled={isSubmitting}
        />
        {errors.pronouns && (
          <p className="text-sm text-destructive">{errors.pronouns.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bannerColor">Banner Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="bannerColor"
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
        <Label htmlFor="avatarURL">Avatar URL</Label>
        <Input
          id="avatarURL"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          {...register("avatarURL")}
          disabled={isSubmitting}
        />
        {errors.avatarURL && (
          <p className="text-sm text-destructive">{errors.avatarURL.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bannerURL">Banner URL</Label>
        <Input
          id="bannerURL"
          type="url"
          placeholder="https://example.com/banner.jpg"
          {...register("bannerURL")}
          disabled={isSubmitting}
        />
        {errors.bannerURL && (
          <p className="text-sm text-destructive">{errors.bannerURL.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profileGradientStart">Profile Gradient Start</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="profileGradientStart"
            type="color"
            {...register("profileGradientStart")}
            disabled={isSubmitting}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="#4e83d9"
            {...register("profileGradientStart")}
            disabled={isSubmitting}
            className="flex-1"
          />
        </div>
        {errors.profileGradientStart && (
          <p className="text-sm text-destructive">
            {errors.profileGradientStart.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profileGradientEnd">Profile Gradient End</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="profileGradientEnd"
            type="color"
            {...register("profileGradientEnd")}
            disabled={isSubmitting}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            placeholder="#8b5cf6"
            {...register("profileGradientEnd")}
            disabled={isSubmitting}
            className="flex-1"
          />
        </div>
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
