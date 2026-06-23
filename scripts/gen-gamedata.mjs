// One-time FFXIV game-data export for the web client, sourced from XIVAPI v2 (https://v2.xivapi.com).
//
// Replaces the plugin's live Lumina reads (it had the game's Excel sheets in process; we don't):
//   - TerritoryType.PlaceName.Name  -> territories.json  (onboarding favourite-location picker;
//     mirrors Screens/Onboarding/OnboardingScreen.Step7Optional.cs EnsureLocationsLoaded:
//     non-empty place names, distinct by name, sorted)
//   - ClassJob job icons             -> jobs/<id>.png + jobs.json  (profile job badge; icon id is the
//     well-known ui/icon/062000/0620{rowId}.tex convention, i.e. 062000 + ClassJob.RowId)
//
// Output is committed under public/assets/gamedata/ so dev/build need no network. Re-run with
// `npm run gen:gamedata` to refresh against a new game patch.

import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const API = 'https://v2.xivapi.com/api';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'gamedata');

// Job rowIds to export icons for — kept in sync with src/shared/enums.ts `Job` (None=0 excluded).
const JOB_IDS = [
  19, 21, 32, 37, 24, 28, 33, 40, 20, 22, 30, 34, 39, 41, 23, 31, 38, 25, 27, 35, 42, 36, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18,
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function genTerritories() {
  const seen = new Set();
  const out = [];
  let after = 0;
  for (; ;) {
    const url = `${API}/sheet/TerritoryType?fields=PlaceName.Name&limit=500&after=${after}`;
    const {rows} = await fetchJson(url);
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      const pn = r.fields?.PlaceName;
      const name = (pn && typeof pn === 'object' ? pn.fields?.Name : undefined)?.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        out.push({id: r.row_id, name});
      }
    }
    after = rows[rows.length - 1].row_id;
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(join(OUT, 'territories.json'), JSON.stringify(out));
  console.log(`territories.json: ${out.length} places`);
}

async function genJobIcons() {
  const dir = join(OUT, 'jobs');
  await mkdir(dir, {recursive: true});
  const manifest = {};
  for (const id of JOB_IDS) {
    const icon = `0620${String(id).padStart(2, '0')}`;
    const url = `${API}/asset?path=ui/icon/062000/${icon}.tex&format=png`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`job ${id}: ${res.status} (skipped)`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(dir, `${id}.png`), buf);
    manifest[id] = `${id}.png`;
  }
  await writeFile(join(OUT, 'jobs.json'), JSON.stringify(manifest));
  console.log(`jobs: ${Object.keys(manifest).length} icons`);
}

await mkdir(OUT, {recursive: true});
await Promise.all([genTerritories(), genJobIcons()]);
console.log('game data written to', OUT);
