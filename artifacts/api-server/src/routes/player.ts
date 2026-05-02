import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = Router();

router.get("/me", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId as string | undefined || auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let [player] = await db.select().from(playersTable).where(eq(playersTable.clerkUserId, userId));

    if (!player) {
      const username = (req.query.username as string) || "Adventurer";
      const avatarUrl = (req.query.avatarUrl as string) || null;

      const [newPlayer] = await db
        .insert(playersTable)
        .values({
          id: nanoid(),
          clerkUserId: userId,
          username,
          avatarUrl,
        })
        .returning();
      player = newPlayer;
    }

    res.json(player);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch/create player");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
