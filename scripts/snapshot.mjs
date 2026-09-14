import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'manifest', 'urls.json');

const baseUrl = (process.env.MOCKUP_BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const username = process.env.MOCKUP_LOGIN_USERNAME || 'demo-mockup';
const password = process.env.MOCKUP_LOGIN_PASSWORD || 'demo-mockup-2026';

function pathToFile(pathname) {
  let p = pathname.split('?')[0];
  if (p === '/' || p === '') {
    return path.join(root, 'index.html');
  }
  p = p.replace(/^\//, '').replace(/\/$/, '');
  return path.join(root, 'pages', p, 'index.html');
}

function injectScripts(html) {
  const inject = `
<script src="/shared/demo-banner.js"></script>
<script src="/shared/demo-intercept.js"></script>`;
  if (html.includes('</body>')) {
    return html.replace('</body>', inject + '\n</body>');
  }
  return html + inject;
}

async function login(page) {
  await page.goto(`${baseUrl}/signin`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/signin') || url.pathname.includes('two-factor'), {
    timeout: 60000,
  }).catch(() => {});
  const current = page.url();
  if (current.includes('two-factor') || current.includes('approve-waiting')) {
    throw new Error('Demo user hit 2FA/approval — use shadow user demo-mockup from DemoMockupUserSeeder');
  }
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error('Missing manifest/urls.json — run: php artisan demo:export-manifest');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const urls = (manifest.urls || []).map(u => (typeof u === 'string' ? u : u.path)).filter(Boolean);

  if (urls.length === 0) {
    console.warn('No URLs in manifest — export manifest after seeding demo DB');
    process.exit(0);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await login(page);

  for (const pathname of urls) {
    const target = `${baseUrl}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    const outFile = pathToFile(pathname);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    try {
      const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 120000 });
      if (!response || response.status() >= 400) {
        console.warn(`Skip ${pathname} — HTTP ${response?.status()}`);
        continue;
      }
      let html = await page.content();
      html = injectScripts(html);
      fs.writeFileSync(outFile, html, 'utf8');
      console.log('Saved', pathname, '→', path.relative(root, outFile));
    } catch (e) {
      console.warn(`Failed ${pathname}:`, e.message);
    }
  }

  await browser.close();
  console.log('Snapshot done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
