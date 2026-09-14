import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const basePath = (process.env.MOCKUP_BASE_PATH || '/Mockup').replace(/\/$/, '');

function walkHtml(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'assets') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkHtml(full, files);
    else if (name.endsWith('.html')) files.push(full);
  }
  return files;
}

function listExistingPages() {
  const pages = new Set([`${basePath}/index.html`]);
  const pagesDir = path.join(root, 'pages');
  function walk(dir, relParts = []) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full, [...relParts, name]);
      else if (name === 'index.html') {
        pages.add(`${basePath}/pages/${relParts.join('/')}/index.html`);
      }
    }
  }
  walk(pagesDir);
  return pages;
}

/** Remove Alpine x-if clones left inside menu group headers (keep <template> only). */
function cleanMenuHeaderClones(html) {
  return html.replace(/<h2\b[^>]*class="[^"]*text-\[16px\][^"]*"[\s\S]*?<\/h2>/g, (block) => {
    const templates = [...block.matchAll(/<template\b[\s\S]*?<\/template>/g)].map((m) => m[0]);
    if (templates.length === 0) return block;
    const open = block.match(/^<h2\b[^>]*>/)?.[0] || '<h2>';
    return `${open}\n${templates.join('\n')}\n</h2>`;
  });
}

/**
 * Remove sidebar group blocks whose title is เว็บไซต์.
 * Groups are sibling <div> wrappers containing the collapsible h2 + ul.
 */
function removeWebsiteMenuGroup(html) {
  const marker = '<!-- Menu Group Title (Collapsible) -->';
  let out = '';
  let rest = html;
  let guard = 0;
  while (guard++ < 50) {
    const idx = rest.indexOf(marker);
    if (idx === -1) {
      out += rest;
      break;
    }
    // find start of wrapping <div> before marker
    const before = rest.lastIndexOf('<div>', idx);
    if (before === -1 || before < idx - 80) {
      out += rest.slice(0, idx + marker.length);
      rest = rest.slice(idx + marker.length);
      continue;
    }
    out += rest.slice(0, before);
    // find matching end: after this group's </ul></div> — scan forward for </ul> then </div>
    const from = rest.slice(before);
    const ulEnd = from.search(/<\/ul>\s*<\/div>/);
    if (ulEnd === -1) {
      out += rest.slice(before);
      break;
    }
    const end = ulEnd + from.match(/<\/ul>\s*<\/div>/)[0].length;
    const block = from.slice(0, end);
    if (!(block.includes('>เว็บไซต์<') || block.includes('data-menu-group="เว็บไซต์"'))) {
      out += block;
    }
    rest = from.slice(end);
  }
  return out;
}

function fixBrokenHrefs(html, existing) {
  html = html.replaceAll(
    `${basePath}/pages/noise-monitor-sync/index.html`,
    `${basePath}/pages/dashboard-noise-quality/index.html`
  );
  html = html.replaceAll(`${basePath}/pages/apps/index.html`, `${basePath}/index.html`);

  html = html.replace(/\b(href|src|action)="([^"]+)"/gi, (full, attr, url) => {
    if (/\$\d|\$\{|action_url\s*\|\||notification\.action_url/.test(url)) {
      return `${attr}="#"`;
    }
    if (attr.toLowerCase() === 'href' && url.startsWith(`${basePath}/pages/`)) {
      const clean = url.split('#')[0].split('?')[0];
      if (!existing.has(clean) && !/\.(css|js|png|jpe?g|gif|webp|svg|pdf|ico)$/i.test(clean)) {
        return `${attr}="${url}" data-demo-missing="1"`;
      }
    }
    return full;
  });

  return html;
}

function stripLivewire(html) {
  return html.replace(/<script[^>]*livewire[^>]*>\s*<\/script>/gi, '');
}

function ensureAlpineBootCss(html) {
  const boot = `<style id="mockup-alpine-boot">html:not(.alpine-ready) ul[x-show]{display:none!important}[x-cloak]{display:none!important}</style>
<script>
document.addEventListener('alpine:initialized', function () {
  document.documentElement.classList.add('alpine-ready');
});
setTimeout(function () { document.documentElement.classList.add('alpine-ready'); }, 2500);
</script>`;
  if (html.includes('id="mockup-alpine-boot"')) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${boot}`);
}

const existing = listExistingPages();
const files = [...walkHtml(path.join(root, 'pages')), path.join(root, 'index.html')].filter(fs.existsSync);

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  html = cleanMenuHeaderClones(html);
  html = removeWebsiteMenuGroup(html);
  html = fixBrokenHrefs(html, existing);
  html = stripLivewire(html);
  html = ensureAlpineBootCss(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('Fixed', path.relative(root, file));
}

fs.writeFileSync(
  path.join(root, 'shared', 'existing-pages.json'),
  JSON.stringify({ basePath, pages: [...existing].sort() }, null, 2),
  'utf8'
);
console.log('Pages catalog:', existing.size);
