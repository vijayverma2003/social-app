import { getAuthenticatedUser } from "@/lib/auth";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

const ProfilePage = async () => {
  const user = await getAuthenticatedUser();

  return (
    <div>
      <h1 className="text-xl font-medium">Profile Settings</h1>
      <ProfileSettingsForm user={user} />
    </div>
  );
};

export default ProfilePage;
