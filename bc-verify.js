const { spawn, spawnSync } = require("child_process");

const build = spawnSync("npm", ["run", "build"], { stdio: "pipe", encoding: "utf8" });
if (build.status !== 0) {
  console.log(build.stdout + build.stderr);
  process.exit(1);
}

const serve = spawn("npx", ["serve", "-s", "out", "-l", "3417"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function check(path, width, height) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`http://localhost:3417${path}`, { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    const sel = document.querySelector('[data-bridge-table]') || document.body;
    const r = sel.getBoundingClientRect();
    return {
      table: !!document.querySelector('[data-bridge-table]'),
      overflow: Math.max(0, r.right - window.innerWidth, 0 - r.left),
    };
  });
  await browser.close();
  return out;
}

(async () => {
  await sleep(2500);
  for (const [path, w, h] of [
    ["/tactical", 1280, 900],
    ["/tactical", 390, 844],
  ]) {
    try {
      const r = await check(path, w, h);
      console.log(`OK   ${path} (${w}px) overflow=${r.overflow}px table=${r.table}`);
    } catch (e) {
      console.log(`ERR  ${path}: ${e.message.split("\n")[0]}`);
    }
  }
  serve.kill();
  process.exit(0);
})();
