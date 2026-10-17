// Generated local fixtures only: exercise true circular touch geometry, not hosted Auth.
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { makeMaze } from "../src/engine/maze";
async function main() {
  const server = createServer((req, res) => {
    let f = path.join(path.resolve("dist"), (req.url || "/").split("?")[0]);
    if (!path.extname(f)) f = path.resolve("dist/index.html");
    try {
      res.setHeader(
        "Content-Type",
        f.endsWith(".js")
          ? "application/javascript"
          : f.endsWith(".html")
            ? "text/html"
            : "application/octet-stream",
      );
      res.end(readFileSync(f));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(8086, "127.0.0.1", r));
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: [
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-dev-shm-usage",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--in-process-gpu",
    ],
  });
  try {
    const p = await b.newPage({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      }),
      errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:8086");
    await p
      .getByRole("button", { name: "Open profile", exact: true })
      .waitFor();
    await p.evaluate(() => {
      const profileId = "player-1";
      localStorage.setItem(
        "dangal-state-v1",
        JSON.stringify({
          profiles: [{ id: profileId, name: "Shape Tester", avatar: -1 }],
          settings: {
            language: "en",
            haptics: false,
            music: false,
            sound: false,
            reducedMotion: true,
            activeProfileId: profileId,
          },
          attempts: Array.from({ length: 30 }, (_, level) => ({
            id: `fixture:${level}`,
            profileId,
            name: "Shape Tester",
            game: "maze",
            level,
            variant: 0,
            elapsedMs: 22000,
            moves: 20,
            assisted: false,
            createdAt: new Date().toISOString(),
          })),
          feedback: [],
          wallets: {},
        }),
      );
    });
    await p.reload();
    await p
      .getByRole("button", { name: "Select Maze Runner", exact: true })
      .click();
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    await p
      .getByRole("button", { name: "Puzzle 31, play", exact: true })
      .click();
    const surface = p.getByTestId("board-input-surface");
    await surface.waitFor();
    const box = await surface.boundingBox();
    assert.ok(box);
    await p.screenshot({ path: "test-results/circular-maze-preview.png" });
    const level = makeMaze(30),
      s = level.size,
      w = box.width,
      rad = w / 2,
      unit = (rad * 0.88) / s,
      inner = rad * 0.12;
    const pos = (r: number, a: number) => ({
      x: box.x + rad + Math.cos(a) * (inner + (r + 0.5) * unit),
      y: box.y + rad + Math.sin(a) * (inner + (r + 0.5) * unit),
    });
    const cdp = await p.context().newCDPSession(p);
    const send = async (type: "touchStart" | "touchEnd" | "touchMove" | "touchCancel", v?: { x: number; y: number }) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: v ? [v] : [] });
    let old = level.solution[0],
      r = Math.floor(old / s),
      a = (((old % s) + 0.5) * Math.PI * 2) / s;
    await send("touchStart", pos(r, a));
    await p.getByTestId("puzzle-trail").waitFor({ state: "attached" });
    for (const cell of level.solution.slice(1)) {
      const nr = Math.floor(cell / s);
      let da = (((cell % s) + 0.5) * Math.PI * 2) / s - a;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      for (let i = 1; i <= 8; i++)
        await send("touchMove", pos(r + ((nr - r) * i) / 8, a + (da * i) / 8));
      r = nr;
      a += da;
      old = cell;
    }
    await send("touchEnd");
    await p.getByText(/^(Puzzle cleared!|Lightning clear!)$/).waitFor();
    await p.getByRole("button", { name: "Journey", exact: true }).click();
    const cell = await p
      .getByRole("button", { name: "Puzzle 31, completed", exact: true })
      .textContent();
    assert.ok(cell?.includes("★"));
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS actual circular touch arcs, radial corridors, wrap seam, level completion and immediate map stars; local fixtures only.",
    );
  } finally {
    await b.close();
    server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
