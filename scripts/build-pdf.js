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
const body = md.render(source);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Source+Code+Pro:wght@400;500&display=swap');

  :root {
    --ink:       #1a1a2e;
    --gold:      #c9a84c;
    --gold-lt:   #e8d5a3;
    --slate:     #2c3e50;
    --rule:      #c9a84c44;
    --bg:        #faf7f2;
    --bg-alt:    #f0ebe0;
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
    background: linear-gradient(160deg, #0f1923 0%, #1a2a3a 60%, #0f1923 100%);
    color: #f5e9d0;
    padding: 64px 60px 48px;
    page-break-after: always;
    border-bottom: 4px solid var(--gold);
  }
  .cover h1 {
    font-family: 'Cinzel', 'Trajan Pro', serif;
    font-size: 36pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--gold);
    text-shadow: 0 2px 12px #c9a84c66;
    margin-bottom: 12px;
    line-height: 1.2;
  }
  .cover blockquote {
    font-style: italic;
    font-size: 13pt;
    color: #c8c0b0;
    border: none;
    padding: 0;
    margin: 0;
    background: none;
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
  tbody tr:hover { background: #e8e0d0; }
  td {
    padding: 6px 10px;
    border: 1px solid #d8d0c0;
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
  h2 { page-break-before: auto; }

  @media print {
    body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead { display: table-header-group; }
    tr    { page-break-inside: avoid; }
  }
`;

// Detect if the first h2 block is the cover (title + tagline)
// We wrap just the first block in a styled cover div
const coverTitle = 'Tower Seekers — Game Design Document';

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
  <h1>Tower Seekers</h1>
  <p style="font-family:'Cinzel',serif;font-size:13pt;color:#a0c0c8;letter-spacing:0.1em;margin-bottom:24px;">GAME DESIGN DOCUMENT</p>
  <blockquote>"Deep unit mastery. Pure counterplay. The JRPG reimagined for competitive play."</blockquote>
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

const outPath = resolve(ROOT, '.local/game-design.pdf');
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
      <span>Tower Seekers — Game Design Document</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log(`PDF saved to: ${outPath}`);
