import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const basePath = (process.env.MOCKUP_BASE_PATH || '/Mockup').replace(/\/$/, '');

const STATIC_PREFIXES = [
  'assets/',
  'shared/',
  'build/',
  'images/',
  'storage/',
  'fonts/',
  'js/',
  'css/',
  'favicon',
  'livewire',
  'vendor/',
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'assets') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.html')) files.push(full);
  }
  return files;
}

function isAssetLikePath(pathname) {
  const p = pathname.split('?')[0].split('#')[0];
  return /\.(css|js|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|json)$/i.test(p);
}

/** Normalize any absolute site path to the correct GitHub Pages URL. */
function rewritePath(raw) {
  if (!raw || raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#') || raw.startsWith('javascript:')) {
    return raw;
  }

  let u = raw.trim();
  // Keep protocol-relative CDN URLs
  if (u.startsWith('//')) return u;

  const qIndex = u.search(/[?#]/);
  let pathOnly = qIndex >= 0 ? u.slice(0, qIndex) : u;
  const suffix = qIndex >= 0 ? u.slice(qIndex) : '';

  // Strip accidental host leftovers
  pathOnly = pathOnly.replace(/^https?:\/\/[^/]+/i, '');

  // Collapse previous broken rewrites
  pathOnly = pathOnly
    .replace(/\/pages\/Mockup\/build\//g, '/build/')
    .replace(/\/Mockup\/pages\/Mockup\/build\//g, '/build/')
    .replace(/\/Mockup\/build\//g, '/build/')
    .replace(/\/Mockup\/images\//g, '/images/')
    .replace(/\/Mockup\/assets\//g, '/assets/')
    .replace(/\/Mockup\/shared\//g, '/shared/')
    .replace(/\/Mockup\/js\//g, '/js/')
    .replace(/\/Mockup\/css\//g, '/css/')
    .replace(/\/Mockup\/fonts\//g, '/fonts/')
    .replace(/\/Mockup\/storage\//g, '/storage/')
    .replace(/\/index\.html$/i, '');

  // Absolute-ize
  if (!pathOnly.startsWith('/')) {
    pathOnly = '/' + pathOnly;
  }

  // Map physical asset folders used in this repo
  if (pathOnly.startsWith('/build/')) {
    return `${basePath}/assets${pathOnly}${suffix}`;
  }
  if (pathOnly.startsWith('/images/')) {
    return `${basePath}/assets${pathOnly}${suffix}`;
  }
  if (pathOnly.startsWith('/assets/')) {
    return `${basePath}${pathOnly}${suffix}`;
  }
  if (pathOnly.startsWith('/shared/')) {
    return `${basePath}${pathOnly}${suffix}`;
  }
  if (pathOnly.startsWith('/js/') || pathOnly.startsWith('/css/') || pathOnly.startsWith('/fonts/') || pathOnly.startsWith('/storage/')) {
    // Prefer assets/ copy when present; otherwise keep under base
    const underAssets = path.join(root, 'assets', pathOnly.slice(1));
    if (fs.existsSync(underAssets)) {
      return `${basePath}/assets${pathOnly}${suffix}`;
    }
    return `${basePath}${pathOnly}${suffix}`;
  }

  if (pathOnly === '/' || pathOnly === '' || pathOnly === '/apps' || pathOnly === '/Mockup' || pathOnly === `${basePath}`) {
    return `${basePath}/index.html${suffix}`;
  }

  // Already a pages link
  let clean = pathOnly.replace(new RegExp(`^${basePath}`), '').replace(/^\//, '');
  if (clean.startsWith('pages/')) {
    const page = clean.replace(/\/$/, '');
    return isAssetLikePath(page) ? `${basePath}/${page}${suffix}` : `${basePath}/${page}/index.html${suffix}`;
  }

  // Static leftovers (livewire, favicon, etc.)
  if (STATIC_PREFIXES.some((p) => clean.startsWith(p) || pathOnly.slice(1).startsWith(p))) {
    return `${basePath}/${clean}${suffix}`;
  }

  // App routes → static pages
  clean = clean.replace(/\/$/, '');
  if (isAssetLikePath(clean)) {
    return `${basePath}/${clean}${suffix}`;
  }
  return `${basePath}/pages/${clean}/index.html${suffix}`;
}

function rewriteHtml(file) {
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(/https?:\/\/pcdapp\.pcd\.go\.th/gi, '');
  html = html.replace(/https?:\/\/127\.0\.0\.1:\d+/gi, '');
  html = html.replace(/https?:\/\/localhost:\d+/gi, '');

  // Remove broken/outdated base tags; absolute /Mockup paths do not need <base>
  html = html.replace(/<base\b[^>]*>\s*/gi, '');

  html = html.replace(/\b(href|src|action|poster|data-src)=["']([^"']+)["']/gi, (full, attr, url) => {
    const next = rewritePath(url);
    return `${attr}="${next}"`;
  });

  // srcset
  html = html.replace(/\bsrcset=["']([^"']+)["']/gi, (full, value) => {
    const next = value
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return trimmed;
        const [u, ...rest] = trimmed.split(/\s+/);
        return [rewritePath(u), ...rest].join(' ');
      })
      .join(', ');
    return `srcset="${next}"`;
  });

  // CSS url(...) in inline style / style tags (skip data:)
  html = html.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (full, quote, url) => {
    if (/^(data:|https?:|\/\/)/i.test(url)) return full;
    return `url(${quote}${rewritePath(url)}${quote})`;
  });

  fs.writeFileSync(file, html, 'utf8');
}

const files = [...walk(path.join(root, 'pages')), path.join(root, 'index.html')].filter(fs.existsSync);
for (const f of files) {
  rewriteHtml(f);
  console.log('Rewrote', path.relative(root, f));
}
console.log('Base path:', basePath);
console.log('Files:', files.length);
