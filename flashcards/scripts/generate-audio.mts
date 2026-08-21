import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { LISTENINGS } from "../prisma/listening-content";
import { SPEAKINGS } from "../prisma/speaking-content";

const OUT_DIR = path.resolve("public/audio/es/listening");
const SPEAKING_OUT_DIR = path.resolve("public/audio/es/speaking");

async function writeMp3(
  tts: MsEdgeTTS,
  outDir: string,
  slug: string,
  script: string,
) {
  const filePath = path.join(outDir, `${slug}.mp3`);
  const { audioStream } = await tts.toStream(script);
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, buffer);
  console.log(`OK ${slug}.mp3 (${buffer.length} bytes)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(SPEAKING_OUT_DIR, { recursive: true });
  const tts = new MsEdgeTTS();
  await tts.setMetadata("es-ES-ElviraNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const item of LISTENINGS) {
    await writeMp3(tts, OUT_DIR, item.slug, item.script);
  }

  for (const item of SPEAKINGS) {
    await writeMp3(tts, SPEAKING_OUT_DIR, item.slug, item.targetText);
  }

  tts.close();
}

main().catch((e) => {
  console.error("AUDIO GENERATION FAILED:", e);
  process.exitCode = 1;
});
