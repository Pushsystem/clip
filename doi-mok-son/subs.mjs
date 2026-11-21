// export the in-world sign captions as cues for subtitles_th.srt
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const src = (await import('fs')).readFileSync(join(HERE, 'story.js'), 'utf8');
const SIGNS = [...src.matchAll(/\{ id: 's\d', t0: ([\d.]+), t1: ([\d.]+), text: '([^']+)' \}/g)].map(m => ({ t0: +m[1], t1: +m[2], text: m[3] }));
const tm = src.match(/TITLE = \{ t0: ([\d.]+), t1: ([\d.]+), main: '([^']+)', sub: '([^']+)'/);
SIGNS.push({ t0: +tm[1], t1: +tm[2], text: tm[3] + ' — ' + tm[4] });
mkdirSync(join(HERE, 'out'), { recursive: true });
writeFileSync(join(HERE, 'out', 'cues.json'), JSON.stringify(SIGNS, null, 1));
console.log(SIGNS.length, 'cues');
