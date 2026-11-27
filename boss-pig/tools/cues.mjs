// Caption cues from the film's own timeline (the same cues are burned into the picture): node tools/cues.mjs > out/cues.json
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const film = await import(path.join(HERE, 'film.js'));
film.setup(JSON.parse(fs.readFileSync(path.join(HERE, 'vo/dur.json'))), JSON.parse(fs.readFileSync(path.join(HERE, 'vo/lines.json'))));
process.stdout.write(JSON.stringify(film.srtCues(), null, 1));
