import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL =
  "https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Battle%20Animations/Infantry%20-%20(Swd)%20Myrms%20and%20Swordmasters/%5BMyrmidon-Reskin%5D%20Leo_Link's%20Alt%20%5BM%5D/1.%20Sword/";

const OUT_DIR = path.resolve(
  __dirname,
  "../../artifacts/game-client/public/assets/units/myrmidon",
);

const FRAME_COUNT = 39;

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  skip (exists): ${path.basename(dest)}`);
      resolve();
      return;
    }
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`  downloaded: ${path.basename(dest)}`);
          resolve();
        });
      })
      .on("error", (err) => {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Saving frames to: ${OUT_DIR}`);

  const failures: string[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const name = `Sword_${String(i).padStart(3, "0")}`;
    const url = `${BASE_URL}${name}.png`;
    const dest = path.join(OUT_DIR, `${name}.png`);
    try {
      await download(url, dest);
    } catch (err) {
      console.error(`  FAILED: ${name} — ${err}`);
      failures.push(name);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} frame(s) failed to download: ${failures.join(", ")}`);
    process.exit(1);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
