import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const replacements = [
  [/pcdapp\.pcd\.go\.th/gi, 'demo.example.mock'],
  [/pcdweb\.pcd\.go\.th/gi, 'public.example.mock'],
  [/@pcd\.go\.th/gi, '@example.mock'],
  [/pcd\.go\.th/gi, 'example.mock'],
];

const forbidden = [
  /@pcd\.go\.th/i,
  /pcdapp\.pcd\.go\.th/i,
  /pcdweb\.pcd\.go\.th/i,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'assets') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(html|json|js|md)$/i.test(name)) files.push(full);
  }
  return files;
}

let fixed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content;
  for (const [re, to] of replacements) {
    next = next.replace(re, to);
  }
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8');
    fixed++;
  }
}
console.log(`Sanitized ${fixed} file(s).`);

let issues = 0;
for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  for (const re of forbidden) {
    if (re.test(content)) {
      console.error('FORBIDDEN pattern in', path.relative(root, file), re.toString());
      issues++;
    }
  }
}

if (issues > 0) {
  console.error(`Scrub failed: ${issues} issue(s).`);
  process.exit(1);
}
console.log('Scrub OK — no forbidden production patterns found.');
