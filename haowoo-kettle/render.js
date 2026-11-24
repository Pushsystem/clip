// node render.js [preview t1,t2,...]  -> preview PNGs, or full render to out/haowoo_kettle_45s.mp4
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const dir = __dirname;
const tl = fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8');
fs.writeFileSync(path.join(dir, '_render.html'), fs.readFileSync(path.join(dir, 'video.html'), 'utf8').replace('TIMELINE_JSON', tl));
const { total, fps } = JSON.parse(tl);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(dir, '_render.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
  if (process.argv[2] === 'preview') {
    for (const t of process.argv[3].split(',').map(Number)) {
      await page.evaluate(t => setTime(t), t);
      await page.screenshot({ path: path.join(dir, 'out', `preview_${t}.png`) });
    }
    return browser.close();
  }
  const out = path.join(dir, 'out', 'haowoo_kettle_45s.mp4');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-i', path.join(dir, 'audio', 'mix.wav'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(total * fps);
  for (let f = 0; f < N; f++) {
    await page.evaluate(t => setTime(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${N}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
