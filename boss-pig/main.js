// Page contract: window.READY, window.render(t), window.DUR, window.EV, window.TEXTS
import { textures } from './engine/toon.js';
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
const probe = 'กขคหมูบ้าน 0123';
await Promise.all(['500 40px Prompt', '600 40px Prompt', '80px Chonburi', '60px Sriracha', '80px Slab'].map(f => document.fonts.load(f, probe)));
textures();
let durs = {}; try { durs = await (await fetch('vo/dur.json')).json(); } catch (e) {}
let lines = []; try { lines = await (await fetch('vo/lines.json')).json(); } catch (e) {}
const film = await import('./film.js');
const IM = {}; await Promise.all([1, 2, 3, 4, 5].map(n => new Promise(r => { const i = new Image(); i.onload = () => { IM[n] = i; r(); }; i.onerror = r; i.src = 'img/pig' + n + '.jpg'; })));
film.setup(durs, lines, IM);
window.DUR = film.DUR; window.EV = film.events(); window.SRT = film.srtCues();
window.TEXTS = t => film.texts(t);
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); film.renderFilm(g, t, Q); };
window.READY = true;
