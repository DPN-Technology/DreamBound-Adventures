import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.DREAMBOUND_URL || 'http://127.0.0.1:8040/';
const OUT = '.github/screenshots';

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'dark',
  reducedMotion: 'reduce'
});
const page = await context.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') console.error('[browser]', msg.text());
});
page.on('pageerror', err => console.error('[pageerror]', err.message));

async function shot(name) {
  await page.waitForTimeout(900);
  const path = OUT + '/' + name + '.png';
  await page.screenshot({ path, fullPage: false });
  const stat = await fs.stat(path);
  if (stat.size < 20000) throw new Error(name + ' screenshot is unexpectedly small (' + stat.size + ' bytes)');
  console.log('[capture] ' + path + ' (' + stat.size + ' bytes)');
}

const baseState = {
  player: { x: 220, y: 650, dir: 0, speed: 250 },
  questStep: 0,
  signalSolved: false,
  solarFixed: false,
  rocketFixed: false,
  launched: false,
  moonRoute: false,
  moonRocks: [],
  stationVisited: false,
  stationGarden: false,
  roverUnlocked: false,
  roverActive: false,
  lumaRescued: false,
  lunarBadge: false,
  stationDiscoveries: [],
  completedQuests: [],
  lumaBond: 0,
  sceneVisits: ['surface'],
  badges: [],
  totalDistance: 840,
  moonCrystals: 0,
  baseModules: [],
  codexEntries: [],
  completedWorldEvents: [],
  npcFriendship: { nova: 0, gear: 0, moss: 0 },
  meteorSamples: 0,
  auroraSeen: false,
  eventWins: 0,
  masteryAchievements: [],
  stars: 6,
  gems: 2
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(state => {
  localStorage.clear();
  localStorage.setItem('dreambound-vnext-space-v1', JSON.stringify(state));
}, baseState);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.DreamBoundVNext?.scene && !!window.DreamBoundVNext?.world);
await shot('unified-space-center');

const moonState = {
  ...baseState,
  player: { x: 1570, y: 735, dir: 0, speed: 250 },
  questStep: 5,
  signalSolved: true,
  solarFixed: true,
  rocketFixed: true,
  launched: true,
  moonRoute: true,
  moonRocks: ['rock-a', 'rock-b', 'rock-c'],
  stationVisited: true,
  stationGarden: true,
  roverUnlocked: true,
  roverActive: true,
  lumaRescued: true,
  lunarBadge: true,
  stationDiscoveries: ['Earthrise', 'Moon crystal pattern'],
  completedQuests: ['launch-path', 'lunar-guardian'],
  lumaBond: 8,
  sceneVisits: ['surface', 'station'],
  badges: ['Space Pathfinder', 'Lunar Guardian', 'Best Moon Friends'],
  totalDistance: 18420,
  moonCrystals: 36,
  baseModules: ['habitat', 'observatory', 'garage', 'greenhouse'],
  codexEntries: ['Earthrise', 'Moon crystal', 'Luma', 'Rover blueprint', 'Lunar Resonance'],
  completedWorldEvents: ['meteor-shower', 'aurora-wave'],
  npcFriendship: { nova: 4, gear: 3, moss: 5 },
  meteorSamples: 3,
  auroraSeen: true,
  eventWins: 3,
  masteryAchievements: ['first-launch', 'moon-friend', 'event-rookie', 'best-buddy'],
  stars: 58,
  gems: 24
};

await page.evaluate(state => {
  localStorage.setItem('dreambound-vnext-space-v1', JSON.stringify(state));
}, moonState);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.DreamBoundVNext?.scene && window.DreamBoundVNext?.state?.lumaRescued === true);
await shot('unified-moon');

await page.waitForFunction(() => typeof window.DreamBoundVNext?.environmentNetwork?.open === 'function');
await page.evaluate(() => window.DreamBoundVNext.environmentNetwork.open());
await page.waitForSelector('#vnextModal:not(.hidden)');
await shot('unified-systems');
await page.evaluate(() => window.DreamBoundVNext.ui.closeModal());

await page.evaluate(() => {
  window.DreamBoundVNext.scene.enter('station', { x: 485, y: 470 });
});
await page.waitForFunction(() => window.DreamBoundVNext?.scene?.id === 'station');
await shot('unified-lunar-station');

await browser.close();

for (const file of [
  'unified-space-center.png',
  'unified-moon.png',
  'unified-systems.png',
  'unified-lunar-station.png'
]) {
  await fs.access(OUT + '/' + file);
}
console.log('[capture] Unified DreamBound gameplay evidence complete.');
