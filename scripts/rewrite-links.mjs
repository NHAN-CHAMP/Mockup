import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

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
  html = html.replace(/https?:\/\/[^/"']+(?=\/)/g, '');
  html = html.replace(/href="(\/[^"#?]+)\/?"/g, (match, p) => {
    if (p.startsWith('//') || p.startsWith('/shared') || p.startsWith('/assets')) return match;
    const clean = p.replace(/^\//, '');
    return `href="/pages/${clean}/index.html"`;
  });
  fs.writeFileSync(file, html, 'utf8');
}

const files = [...walk(path.join(root, 'pages')), path.join(root, 'index.html')].filter(fs.existsSync);
for (const f of files) {
  rewriteHtml(f);
  console.log('Rewrote', path.relative(root, f));
}
