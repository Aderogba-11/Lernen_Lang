import "dotenv/config";
import { db } from "../lib/db";
const l = await db.lesson.findFirstOrThrow({ where: { status: "PUBLISHED" }, select: { id: true } });
console.log(l.id);
await db.$disconnect();
