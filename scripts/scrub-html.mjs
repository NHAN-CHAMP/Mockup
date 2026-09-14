import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const forbidden = [
  /@pcd\.go\.th/i,
  /pcdapp\.pcd\.go\.th/i,
  /pcdweb\.pcd\.go\.th/i,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(html|json)$/i.test(name)) files.push(full);
  }
  return files;
}

let issues = 0;
for (const file of walk(root)) {
  if (file.includes('node_modules')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const re of forbidden) {
    if (re.test(content)) {
      console.error('FORBIDDEN pattern in', path.relative(root, file), re.toString());
      issues++;
    }
  }
}

if (issues > 0) {
  console.error(`Scrub failed: ${issues} issue(s). Replace with mock data before push.`);
  process.exit(1);
}
console.log('Scrub OK — no forbidden production patterns found.');
