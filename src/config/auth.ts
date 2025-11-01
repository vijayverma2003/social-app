import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { User } from "../entities/User";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/callback/google",
    scope: ["profile", "email"],
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any
  ) => {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error("Email is required"));

    const user = await User.findByEmail(email);
    console.log(user);
    if (
      user &&
      user.accounts.some(
        (account) =>
          account.provider === "google" && account.providerId === profile.id
      )
    )
      return done(null, user);

    if (
      user &&
      !user.accounts.some(
        (account) =>
          account.provider === "google" && account.providerId === profile.id
      )
    ) {
      const updatedUser = await User.update(user._id.toString(), {
        accounts: [
          ...user.accounts,
          { provider: "google", providerId: profile.id },
        ],
      });
      return done(null, updatedUser);
    }

    const newUser = await User.create({
      email,
      accounts: [{ provider: "google", providerId: profile.id }],
      profile: null,
    });

    return done(null, newUser);
  }
);

export { googleStrategy };
