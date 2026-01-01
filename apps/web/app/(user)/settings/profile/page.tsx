import { getAuthenticatedUser } from "@/lib/auth";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

const ProfilePage = async () => {
  const user = await getAuthenticatedUser();

  return (
    <div className="p-4 bg-secondary/50 rounded-2xl max-w-2xl">
      <h1 className="text-xl font-medium">Profile Settings</h1>
      <ProfileSettingsForm user={user} />
    </div>
  );
};

export default ProfilePage;
