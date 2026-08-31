import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { seedStarterContent } from "../src/server/services/starter-content";

const db = new PrismaClient();

async function main() {
  const email = process.env.DEMO_EMAIL ?? "demo@mylesson.app";
  const password = process.env.DEMO_PASSWORD ?? "demo1234";

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "Demo İstifadəçi", passwordHash, isDemo: true },
    update: { passwordHash, isDemo: true },
  });

  console.log(`· demo user: ${email} / ${password}`);

  const result = await seedStarterContent(user.id);
  if (result) {
    console.log(`· seeded ${result.terms} terms + relations + questions + embeddings`);
  } else {
    console.log("· demo user already has content — skipping");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
