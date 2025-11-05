import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const userId = (req as any).auth?.userId;
  console.log(req.auth());
  if (!userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ message: "Hello World", userId });
});

export default router;
