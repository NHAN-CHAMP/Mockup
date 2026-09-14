import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const basePath = (process.env.MOCKUP_BASE_PATH || '/Mockup').replace(/\/$/, '');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.html')) files.push(full);
  }
  return files;
}

function rewriteHtml(file) {
  let html = fs.readFileSync(file, 'utf8');

  // Strip absolute production hosts
  html = html.replace(/https?:\/\/pcdapp\.pcd\.go\.th/gi, '');
  html = html.replace(/https?:\/\/127\.0\.0\.1:8765/gi, '');
  html = html.replace(/https?:\/\/localhost:8765/gi, '');

  // Inject <base> for GitHub Pages project path
  if (!html.includes('<base ')) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n  <base href="${basePath}/">`);
  }

  // Point Vite/build assets to copied folder if present
  html = html.replace(/(href|src)="\/(build|images|storage|fonts|js|css)\//g, `$1="${basePath}/$2/`);

  // Shared scripts
  html = html.replace(/(src|href)="\/shared\//g, `$1="${basePath}/shared/`);
  html = html.replace(/(src|href)="shared\//g, `$1="${basePath}/shared/`);

  // Internal app links → pages/.../index.html under base
  html = html.replace(/href="\/(?!shared|assets|build|images|storage|fonts|#)([^"#?]+)\/?"/g, (match, p) => {
    if (p.startsWith('pages/')) return `href="${basePath}/${p.replace(/\/$/, '')}/index.html"`;
    const clean = p.replace(/^\//, '').replace(/\/$/, '');
    if (!clean || clean === 'apps') return `href="${basePath}/index.html"`;
    return `href="${basePath}/pages/${clean}/index.html"`;
  });

  fs.writeFileSync(file, html, 'utf8');
}

const files = [...walk(path.join(root, 'pages')), path.join(root, 'index.html')].filter(fs.existsSync);
for (const f of files) {
  rewriteHtml(f);
  console.log('Rewrote', path.relative(root, f));
}
console.log('Base path:', basePath);
