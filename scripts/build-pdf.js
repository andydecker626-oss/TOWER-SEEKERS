import puppeteer from 'puppeteer-core';
import MarkdownIt from 'markdown-it';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CHROMIUM_PATH = '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const source = readFileSync(resolve(ROOT, '.local/game-design.md'), 'utf8');
const rawBody = md.render(source);

// Inject a page-break marker before every h2 except the very first,
// so each major section starts on a fresh page.
let firstH2 = true;
const body = rawBody.replace(/<h2/g, () => {
  if (firstH2) { firstH2 = false; return '<h2'; }
  return '<div class="section-break"></div><h2';
});

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Source+Code+Pro:wght@400;500&display=swap');

  :root {
    --ink:       #1a1a2e;
    --gold:      #c9a84c;
    --gold-lt:   #e8d5a3;
    --slate:     #2c3e50;
    --rule:      #c9a84c55;
    --bg:        #f5f7fa;
    --bg-alt:    #eaecf2;
    --muted:     #5a5a7a;
    --red:       #8b2e2e;
    --teal:      #1e5f6e;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.65;
    color: var(--ink);
    background: var(--bg);
    padding: 0;
  }

  /* ── Cover block ─────────────────────────────────── */
  .cover {
    background: linear-gradient(160deg, #080e14 0%, #0f1c2b 45%, #152333 75%, #0a1520 100%);
    color: #f5e9d0;
    padding: 100px 64px 72px;
    page-break-after: always;
    border-bottom: 5px solid var(--gold);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }
  .cover::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 40%, #c9a84c18 0%, transparent 60%),
                radial-gradient(ellipse at 70% 70%, #1e5f6e12 0%, transparent 55%);
    pointer-events: none;
  }
  .cover-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    letter-spacing: 0.35em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 20px;
    opacity: 0.8;
  }
  .cover h1 {
    font-family: 'Cinzel', 'Trajan Pro', serif;
    font-size: 88pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: transparent;
    background: linear-gradient(135deg, #e8c96a 0%, #c9a84c 40%, #f5e09a 65%, #b8922a 100%);
    -webkit-background-clip: text;
    background-clip: text;
    text-shadow: none;
    filter: drop-shadow(0 6px 24px #c9a84c44);
    margin-bottom: 0;
    line-height: 0.95;
    text-transform: uppercase;
  }
  .cover-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 15pt;
    letter-spacing: 0.28em;
    color: #8ab4c4;
    margin-bottom: 44px;
    margin-top: 14px;
    text-transform: uppercase;
    border-top: 1px solid #8ab4c433;
    border-bottom: 1px solid #8ab4c433;
    padding: 8px 0;
    display: inline-block;
  }
  .cover-rule {
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    margin: 0 0 36px;
  }
  .cover blockquote {
    font-style: italic;
    font-size: 12.5pt;
    color: #b0b8c4;
    border: none;
    padding: 0;
    margin: 0;
    background: none;
    max-width: 480px;
    line-height: 1.6;
  }

  /* ── Page body ───────────────────────────────────── */
  .content {
    padding: 44px 52px;
  }

  /* ── Headings ────────────────────────────────────── */
  h1, h2, h3, h4 {
    font-family: 'Cinzel', 'Trajan Pro', serif;
    page-break-after: avoid;
  }
  h1 { display: none; }

  h2 {
    font-size: 17pt;
    font-weight: 700;
    color: var(--slate);
    border-bottom: 2px solid var(--gold);
    padding-bottom: 5px;
    margin: 32px 0 14px;
    letter-spacing: 0.04em;
  }
  h3 {
    font-size: 13pt;
    font-weight: 600;
    color: var(--red);
    margin: 22px 0 8px;
    letter-spacing: 0.02em;
  }
  h4 {
    font-size: 11pt;
    font-weight: 600;
    color: var(--teal);
    margin: 14px 0 6px;
    letter-spacing: 0.02em;
  }

  /* ── Body text ───────────────────────────────────── */
  p { margin-bottom: 8px; }

  a { color: var(--teal); text-decoration: none; }

  strong { font-weight: 600; color: var(--slate); }

  em { color: var(--muted); }

  hr {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 24px 0;
  }

  /* ── Blockquote ──────────────────────────────────── */
  blockquote {
    border-left: 4px solid var(--gold);
    background: var(--bg-alt);
    padding: 10px 18px;
    margin: 14px 0;
    border-radius: 0 4px 4px 0;
    font-style: italic;
    color: var(--muted);
  }

  /* ── Lists ───────────────────────────────────────── */
  ul, ol {
    padding-left: 22px;
    margin-bottom: 10px;
  }
  li { margin-bottom: 3px; }
  li > strong:first-child { color: var(--red); }

  /* ── Tables ──────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px;
    font-size: 10.5pt;
    page-break-inside: avoid;
  }
  thead tr {
    background: var(--slate);
    color: var(--gold-lt);
  }
  thead th {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: 7px 10px;
    text-align: left;
    border: 1px solid #3d5166;
  }
  tbody tr:nth-child(odd)  { background: var(--bg); }
  tbody tr:nth-child(even) { background: var(--bg-alt); }
  tbody tr:hover { background: #dde2ec; }
  td {
    padding: 6px 10px;
    border: 1px solid #cdd3df;
    vertical-align: top;
  }
  td strong { color: var(--ink); }

  /* ── Code ────────────────────────────────────────── */
  code {
    font-family: 'Source Code Pro', 'Courier New', monospace;
    font-size: 9.5pt;
    background: #e8e4da;
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--red);
  }
  pre {
    background: #1a2230;
    color: #d0cfc4;
    border-left: 4px solid var(--gold);
    padding: 14px 18px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: 9pt;
  }

  /* ── Table of Contents ───────────────────────────── */
  .toc-section li { list-style: none; }
  .toc-section a  { color: var(--teal); }

  /* ── Page breaks ─────────────────────────────────── */
  .section-break    { page-break-after: always; break-after: page; height: 0; }
  h3, h4            { page-break-after: avoid; break-after: avoid; }
  h3 + table,
  h4 + table,
  h3 + ul,
  h4 + ul           { page-break-before: avoid; break-before: avoid; }
  p, li             { orphans: 3; widows: 3; }

  @media print {
    body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead { display: table-header-group; }
    tr    { page-break-inside: avoid; break-inside: avoid; }
    table { page-break-inside: auto; }
  }
`;

// Detect if the first h2 block is the cover (title + tagline)
// We wrap just the first block in a styled cover div
const coverTitle = 'Tower Seekers — Game Bible';

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${coverTitle}</title>
<style>${CSS}</style>
</head>
<body>
<div class="cover">
  <p class="cover-eyebrow">Competitive Turn-Based Battler</p>
  <h1>TOWER<br>SEEKERS</h1>
  <p class="cover-subtitle">Game&nbsp;&nbsp;Bible</p>
  <div class="cover-rule"></div>
  <blockquote>"Deep unit mastery. Pure counterplay.<br>The JRPG reimagined for competitive play."</blockquote>
</div>
<div class="content">
${body}
</div>
</body>
</html>`;

writeFileSync(resolve(ROOT, '.local/game-design.html'), fullHtml, 'utf8');
console.log('HTML written — launching Chromium...');

const browser = await puppeteer.launch({
  executablePath: CHROMIUM_PATH,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ],
});

const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

// Group all content into per-section divs and set page-break-after on each.
// Chromium reliably breaks between block-level containers with explicit inline styles.
await page.evaluate(() => {
  const content = document.querySelector('.content');
  const children = Array.from(content.children); // element nodes only

  // Build groups: every H2 starts a new group; preamble goes in group 0
  const groups = [[]];
  children.forEach(child => {
    if (child.tagName === 'H2') groups.push([]);
    groups[groups.length - 1].push(child.cloneNode(true));
  });

  // Re-render as wrapped section divs
  content.innerHTML = '';
  groups.forEach((group, i) => {
    if (!group.length) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'section-page';
    // Every group except the last gets a hard page break after it
    if (i < groups.length - 1) {
      wrapper.style.cssText = 'display:block;page-break-after:always;break-after:page;';
    }
    group.forEach(el => wrapper.appendChild(el));
    content.appendChild(wrapper);
  });
});

const outPath = resolve(ROOT, '.local/game-bible.pdf');
await page.pdf({
  path: outPath,
  format: 'Letter',
  margin: { top: '0', right: '0', bottom: '18mm', left: '0' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width:100%;font-family:Georgia,serif;font-size:9pt;color:#888;
                display:flex;justify-content:space-between;
                padding:0 52px;box-sizing:border-box;">
      <span>Tower Seekers — Game Bible</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log(`PDF saved to: ${outPath}`);
