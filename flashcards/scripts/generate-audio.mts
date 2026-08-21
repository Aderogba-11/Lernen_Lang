import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { LISTENINGS } from "../prisma/listening-content";

const OUT_DIR = path.resolve("public/audio/es/listening");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const tts = new MsEdgeTTS();
  await tts.setMetadata("es-ES-ElviraNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const item of LISTENINGS) {
    const filePath = path.join(OUT_DIR, `${item.slug}.mp3`);
    const { audioStream } = await tts.toStream(item.script);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(filePath, buffer);
    console.log(`OK ${item.slug}.mp3 (${buffer.length} bytes)`);
  }

  tts.close();
}

main().catch((e) => {
  console.error("AUDIO GENERATION FAILED:", e);
  process.exitCode = 1;
});
