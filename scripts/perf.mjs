// Measures the game in a real browser (docs/performance-plan.md, lot 0): `npm run perf`.
// Builds the game, plays saves from the simulator in Chromium through Playwright and prints, for
// each scene, the React work per tick and the main thread's time. Without a graphics card (as in
// the cloud containers) WebGL is emulated: GPU numbers then only compare runs with each other.
//   npm run perf                  every scene
//   npm run perf -- cycle         scenes whose name contains "cycle"
//   npm run perf -- --fresh-saves replay the simulator instead of reusing its saves
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, preview } from 'vite';

const root = resolve(import.meta.dirname, '..');
const work = join(root, 'node_modules/.perf');
const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith('--')) ?? '';
const SECONDS = 8;

async function playwright() {
  for (const name of ['playwright', 'playwright-core']) {
    try {
      return await import(name);
    } catch {
      // Not installed in the project; look for a global install below.
    }
    try {
      const global = execSync('npm root -g', { encoding: 'utf8' }).trim();
      const path = createRequire(join(global, 'noop.js')).resolve(name);
      return await import(pathToFileURL(path).href);
    } catch {
      // Try the next package.
    }
  }
  throw new Error(
    'Playwright is needed: npm install --no-save playwright && npx playwright install chromium',
  );
}

const savesDir = join(work, 'saves');
if (args.includes('--fresh-saves') || !existsSync(join(savesDir, 'cycle.json'))) {
  mkdirSync(savesDir, { recursive: true });
  console.log('Playing the saves with the simulator…');
  await build({
    root,
    logLevel: 'warn',
    build: {
      ssr: join(root, 'scripts/perfSaves.ts'),
      outDir: join(work, 'saves-script'),
      emptyOutDir: true,
    },
  });
  execSync(`node ${join(work, 'saves-script/perfSaves.js')} ${savesDir}`, { stdio: 'inherit' });
}

console.log('Building the game…');
await build({ root, logLevel: 'warn', build: { outDir: join(work, 'dist'), emptyOutDir: true } });
const server = await preview({
  root,
  logLevel: 'warn',
  build: { outDir: join(work, 'dist') },
  preview: { port: 4179, strictPort: false },
});
const url = server.resolvedUrls.local[0];

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};
const SCENES = [
  { name: 'new game, svg', save: null, renderer: 'svg', device: DESKTOP },
  { name: 'season1, svg', save: 'season1', renderer: 'svg', device: DESKTOP },
  { name: 'season2, svg', save: 'season2', renderer: 'svg', device: DESKTOP },
  { name: 'cycle, svg', save: 'cycle', renderer: 'svg', device: DESKTOP },
  { name: 'cycle, pixi', save: 'cycle', renderer: 'pixi', device: DESKTOP, settle: 20000 },
  { name: 'cycle, svg, phone cpu x4', save: 'cycle', renderer: 'svg', device: PHONE, throttle: 4 },
].filter((scene) => scene.name.includes(filter));

const loaded = await playwright();
const { chromium } = loaded.chromium ? loaded : loaded.default;
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function measure(scene) {
  const context = await browser.newContext(scene.device);
  const save = scene.save && readFileSync(join(savesDir, `${scene.save}.json`), 'utf8');
  await context.addInitScript(
    ({ save, renderer }) => {
      if (save) localStorage.setItem('heliotrope.save', save);
      localStorage.setItem('heliotrope.layout.renderer', JSON.stringify(renderer));
      const gl = (window.__perfGl = { draw: 0, target: 0 });
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, options) {
        const ctx = getContext.call(this, type, options);
        if (ctx && /webgl/.test(type) && !ctx.__counted) {
          ctx.__counted = true;
          for (const [method, key] of [
            ['drawElements', 'draw'],
            ['drawArrays', 'draw'],
            ['drawElementsInstanced', 'draw'],
            ['bindFramebuffer', 'target'],
          ]) {
            const original = ctx[method];
            if (original) ctx[method] = (...a) => (gl[key]++, original.apply(ctx, a));
          }
        }
        return ctx;
      };
    },
    { save, renderer: scene.renderer },
  );
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (scene.throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: scene.throttle });
  const start = Date.now();
  await page.goto(`${url}?perf`);
  await page.waitForSelector('.app');
  const load = Date.now() - start;
  // The WebGL map takes long to start when WebGL is emulated.
  await page.waitForTimeout(scene.settle ?? 6000);
  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
  const read = () =>
    page.evaluate(() => {
      const stats = window.__perfStats?.();
      return { commits: stats?.commits ?? 0, rendered: stats?.rendered ?? 0, ...window.__perfGl };
    });
  const [a, ra] = [await metrics(), await read()];
  await page.waitForTimeout(SECONDS * 1000);
  const [b, rb] = [await metrics(), await read()];
  const nodes = await page.evaluate(() => document.getElementsByTagName('*').length);
  await context.close();
  const perSecond = (key) => Math.round(((b[key] - a[key]) * 1000) / SECONDS);
  const commits = rb.commits - ra.commits;
  return {
    scene: scene.name,
    'load ms': load,
    'commits/s': Math.round(commits / SECONDS),
    'components/commit': commits ? Math.round((rb.rendered - ra.rendered) / commits) : 0,
    'script ms/s': perSecond('ScriptDuration'),
    'main thread ms/s': perSecond('TaskDuration'),
    'gl draws/s': Math.round((rb.draw - ra.draw) / SECONDS),
    'gl targets/s': Math.round((rb.target - ra.target) / SECONDS),
    nodes,
  };
}

const rows = [];
for (const scene of SCENES) {
  rows.push(await measure(scene));
  console.log(rows.at(-1));
}
await browser.close();
await server.close();
console.table(rows);
