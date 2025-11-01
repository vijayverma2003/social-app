import { Router } from "express";
import passport from "passport";
import { googleStrategy } from "../config/auth";

const router = Router();

passport.use(googleStrategy);

router.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback/google",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

export default router;
