import { getAuthenticatedUser } from "@/lib/auth";
import FloatingProfile from "../../components/FloatingProfile";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

const ProfilePage = async () => {
  const user = await getAuthenticatedUser();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h1 className="text-xl font-bold">Profile Settings</h1>
        <ProfileSettingsForm user={user} />
      </div>
      <FloatingProfile user={user} />
    </div>
  );
};

export default ProfilePage;
