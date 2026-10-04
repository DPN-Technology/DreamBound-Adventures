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

const p1 = {
  name: 'Nova',
  age: 6,
  color: '#735cff',
  buddy: '🐉',
  stars: 42,
  gems: 18,
  buddyLevel: 6,
  explorerLevel: 5,
  xp: 12,
  achievements: [],
  stickers: ['Rainbow Finder', 'World Explorer'],
  creatures: ['sprout', 'puff'],
  spells: ['sparkle'],
  fossils: 3,
  quests: [],
  buildings: [],
  homeUpgrades: ['plant'],
  homeStyle: 'sky',
  homeThemes: ['sky'],
  settings: { narration: false, reducedMotion: true, difficulty: 'adaptive', weather: true, sessionLimit: 0 },
  created: Date.now(),
  lastPlayed: Date.now(),
  position: { x: 775, y: 520 },
  taken: [],
  photos: ['Home Valley', 'Magic Grove'],
  discoveredZones: ['Home Valley', 'Magic Grove', 'Racing Ridge'],
  buddyPlays: 4,
  wishes: 2,
  totalDistance: 6200,
  worldEvents: 2,
  landmarks: ['homebase', 'moontower'],
  visualBadges: [],
  coopGates: ['home-link'],
  coopSessions: 3,
  teamworkPoints: 14,
  coopActivities: ['race', 'magic'],
  coopWins: 2,
  teamRescues: 1,
  teamMagic: 1,
  teamRepairs: 0,
  avatarV6: { hair: 'spikes', accessory: 'explorer-cap' },
  storyV6: { step: 3, petals: ['petal-home-1', 'petal-home-2', 'petal-home-3'], restored: false, chapterComplete: false },
  storyV7: { step: 1, fossilFragment: false, compassGear: false, pearlLens: false, mapRestored: false, chapterComplete: false, sonarWins: 0 },
  interiorVisits: [],
  submarineUnlocked: false
};

const p2 = {
  ...p1,
  name: 'Sky',
  age: 7,
  color: '#ff5fae',
  buddy: '🦄',
  stars: 31,
  gems: 11,
  explorerLevel: 4,
  position: { x: 860, y: 555 },
  coopGates: [],
  coopActivities: ['rescue']
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(({ p1, p2 }) => {
  localStorage.clear();
  localStorage.setItem('dreambound-profile-0', JSON.stringify(p1));
  localStorage.setItem('dreambound-profile-1', JSON.stringify(p2));
}, { p1, p2 });
await page.reload({ waitUntil: 'networkidle' });

await page.click('#playBtn');
await page.waitForSelector('#profileScreen.active');
await page.click('.profile-slot[data-slot="0"]');
await page.waitForSelector('#gameScreen.active');
await page.waitForFunction(() => document.querySelector('#hudName')?.textContent === 'Nova');
await shot('storybook-world');

await page.click('#coopBtn');
await page.waitForSelector('.coop-profile-card[data-slot="1"]');
await page.click('.coop-profile-card[data-slot="1"]');
await page.waitForSelector('#coopStatus:not(.hidden)');
await shot('sibling-coop');

const advancedBaseState = {
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

await page.goto(BASE + 'vnext.html', { waitUntil: 'networkidle' });
await page.evaluate(state => {
  localStorage.setItem('dreambound-vnext-space-v1', JSON.stringify(state));
}, advancedBaseState);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.DreamBoundVNext?.scene && !!window.DreamBoundVNext?.world);
await shot('advanced-space-center');

const moonState = {
  ...advancedBaseState,
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
  baseModules: ['habitat', 'observatory'],
  codexEntries: ['Earthrise', 'Moon crystal', 'Luma', 'Rover blueprint'],
  completedWorldEvents: ['meteor-shower', 'aurora-wave'],
  npcFriendship: { nova: 4, gear: 3, moss: 5 },
  meteorSamples: 3,
  auroraSeen: true,
  eventWins: 2,
  masteryAchievements: ['first-launch', 'moon-friend', 'event-rookie', 'best-buddy'],
  stars: 58,
  gems: 24
};

await page.evaluate(state => {
  localStorage.setItem('dreambound-vnext-space-v1', JSON.stringify(state));
}, moonState);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.DreamBoundVNext?.scene && window.DreamBoundVNext?.state?.lumaRescued === true);
await shot('moon-rover-luma');

await page.evaluate(() => {
  window.DreamBoundVNext.scene.enter('station', { x: 485, y: 470 });
});
await page.waitForFunction(() => window.DreamBoundVNext?.scene?.id === 'station');
await shot('lunar-station');

await browser.close();

const expected = [
  'storybook-world.png',
  'sibling-coop.png',
  'advanced-space-center.png',
  'moon-rover-luma.png',
  'lunar-station.png'
];
for (const file of expected) {
  await fs.access(OUT + '/' + file);
}
console.log('[capture] DreamBound README gameplay evidence complete.');
