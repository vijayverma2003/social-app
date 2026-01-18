"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UploadButton,
  type SelectedFile,
} from "@/features/messages/components/UploadButton";
import { updateProfile } from "@/services/profilesService";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserProfilePayloadSchema } from "@shared/schemas";
import { UpdateUserProfilePayload, UserWithProfile } from "@shared/types";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProfileCardContent } from "./ProfileCard";

interface ProfileSettingsFormProps {
  user: UserWithProfile;
}

const ProfileSettingsForm = ({ user }: ProfileSettingsFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFiles, setAvatarFiles] = useState<SelectedFile[]>([]);
  const [bannerFiles, setBannerFiles] = useState<SelectedFile[]>([]);
  const [avatarUploadKey, setAvatarUploadKey] = useState(0);
  const [bannerUploadKey, setBannerUploadKey] = useState(0);
  const avatarUploadFnRef = useRef<
    ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
  >(null);
  const bannerUploadFnRef = useRef<
    ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null
  >(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserProfilePayload>({
    resolver: zodResolver(UpdateUserProfilePayloadSchema),
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

  const uploadImage = async (
    files: SelectedFile[],
    uploadFn: ((files: SelectedFile[]) => Promise<SelectedFile[]>) | null,
    setValue: (name: "avatarURL" | "bannerURL", value: string) => void,
    fieldName: "avatarURL" | "bannerURL"
  ): Promise<string> => {
    if (files.length === 0 || !uploadFn) {
      throw new Error(
        `No ${fieldName === "avatarURL" ? "avatar" : "banner"
        } file selected or upload function not available`
      );
    }

    try {
      const uploadedFiles = await uploadFn(files);
      if (uploadedFiles.length > 0 && uploadedFiles[0].url) {
        const imageURL = uploadedFiles[0].url;
        setValue(fieldName, imageURL);
        return imageURL;
      } else {
        throw new Error(
          `Failed to upload ${fieldName === "avatarURL" ? "avatar" : "banner"
          } image`
        );
      }
    } catch (error) {
      throw new Error(
        `${fieldName === "avatarURL" ? "Avatar" : "Banner"} upload failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleAvatarFilesChange = (files: SelectedFile[]) => {
    // Validate that only image files are selected
    const imageFiles = files.filter((f) => f.file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      toast.error("Invalid file type", {
        description: "Avatar must be an image file",
      });
      setAvatarFiles(imageFiles);
    } else {
      setAvatarFiles(files);
    }
  };

  const handleAvatarUploadReady = (
    uploadFn: (files: SelectedFile[]) => Promise<SelectedFile[]>
  ) => {
    avatarUploadFnRef.current = uploadFn;
  };

  const handleBannerFilesChange = (files: SelectedFile[]) => {
    // Validate that only image files are selected
    const imageFiles = files.filter((f) => f.file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      toast.error("Invalid file type", {
        description: "Banner must be an image file",
      });
      setBannerFiles(imageFiles);
    } else {
      setBannerFiles(files);
    }
  };

  const handleBannerUploadReady = (
    uploadFn: (files: SelectedFile[]) => Promise<SelectedFile[]>
  ) => {
    bannerUploadFnRef.current = uploadFn;
  };

  const handleRemoveAvatar = () => {
    setValue("avatarURL", undefined);
    setAvatarFiles([]);
    setAvatarPreviewUrl(null);
    setAvatarUploadKey((prev) => prev + 1);
  };

  const handleRemoveBanner = () => {
    setValue("bannerURL", undefined);
    setBannerFiles([]);
    setBannerPreviewUrl(null);
    setBannerUploadKey((prev) => prev + 1);
  };

  // Watch form values for live preview
  const watchedValues = watch();

  // Create preview URLs for selected files
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (avatarFiles.length > 0 && avatarFiles[0].file.type.startsWith("image/")) {
      const url = URL.createObjectURL(avatarFiles[0].file);
      setAvatarPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAvatarPreviewUrl(null);
    }
  }, [avatarFiles]);

  useEffect(() => {
    if (bannerFiles.length > 0 && bannerFiles[0].file.type.startsWith("image/")) {
      const url = URL.createObjectURL(bannerFiles[0].file);
      setBannerPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBannerPreviewUrl(null);
    }
  }, [bannerFiles]);

  // Get preview values (use selected file previews if available, otherwise use form values)
  const previewValues = useMemo(() => {
    return {
      displayName: watchedValues.displayName || "",
      username: user.username || "",
      discriminator: user.discriminator || "",
      pronouns: watchedValues.pronouns || "",
      avatarURL: avatarPreviewUrl || watchedValues.avatarURL || "",
      bannerURL: bannerPreviewUrl || watchedValues.bannerURL || "",
      bio: watchedValues.bio || "",
      profileGradientStart: watchedValues.profileGradientStart || null,
      profileGradientEnd: watchedValues.profileGradientEnd || null,
    };
  }, [watchedValues, avatarPreviewUrl, bannerPreviewUrl, user.username, user.discriminator]);

  const onSubmitForm = async (data: UpdateUserProfilePayload) => {
    setError(null);
    setIsSaving(true);

    try {
      // Upload images first if they were selected
      let avatarURL = data.avatarURL;
      let bannerURL = data.bannerURL;

      // Upload avatar if files were selected
      if (avatarFiles.length > 0) {
        avatarURL = await uploadImage(
          avatarFiles,
          avatarUploadFnRef.current,
          setValue,
          "avatarURL"
        );
      }

      // Upload banner if files were selected
      if (bannerFiles.length > 0) {
        bannerURL = await uploadImage(
          bannerFiles,
          bannerUploadFnRef.current,
          setValue,
          "bannerURL"
        );
      }

      // Update profile with the final URLs via socket
      await updateProfile({
        ...data,
        avatarURL: avatarURL || "",
        bannerURL: bannerURL || "",
      });

      // Clear selected files after successful submission
      setAvatarFiles([]);
      setBannerFiles([]);

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.";
      setError(errorMessage);
      toast.error("Failed to update profile", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmitForm)} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Your display name"
            {...register("displayName")}
            disabled={isSaving}
          />
          {errors.displayName && (
            <p className="text-sm text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input type="text" {...register("pronouns")} disabled={isSaving} />
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
              disabled={isSaving}
              className="w-20 h-10 cursor-pointer"
            />
          </div>
          {errors.bannerColor && (
            <p className="text-sm text-destructive">
              {errors.bannerColor.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex gap-2 items-center">
            <UploadButton
              key={avatarUploadKey}
              maxFiles={1}
              onFilesChange={handleAvatarFilesChange}
              onUploadFilesReady={handleAvatarUploadReady}
              disabled={isSaving}
              buttonText="Upload Avatar"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveAvatar}
              disabled={isSaving}
              aria-label="Remove avatar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {errors.avatarURL && (
            <p className="text-sm text-destructive">{errors.avatarURL.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Banner</Label>
          <div className="flex gap-2 items-center">
            <UploadButton
              key={bannerUploadKey}
              maxFiles={1}
              onFilesChange={handleBannerFilesChange}
              onUploadFilesReady={handleBannerUploadReady}
              disabled={isSaving}
              buttonText="Upload Banner"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveBanner}
              disabled={isSaving}
              aria-label="Remove banner"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {errors.bannerURL && (
            <p className="text-sm text-destructive">{errors.bannerURL.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea {...register("bio")} disabled={isSaving} />
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
              disabled={isSaving}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              id="profileGradientEnd"
              type="color"
              {...register("profileGradientEnd")}
              disabled={isSaving}
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
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {/* Preview Section */}
      <div className="lg:sticky lg:top-6 h-fit">
        <Label className="mb-4 block">Preview</Label>
        <ProfileCardContent
          variant="card"
          displayName={previewValues.displayName}
          username={previewValues.username}
          discriminator={previewValues.discriminator}
          pronouns={previewValues.pronouns}
          avatarURL={previewValues.avatarURL}
          bannerURL={previewValues.bannerURL}
          bio={previewValues.bio}
          profileGradientStart={previewValues.profileGradientStart}
          profileGradientEnd={previewValues.profileGradientEnd}
          isCurrentUser={true}
        />
      </div>
    </div>
  );
};

export default ProfileSettingsForm;
