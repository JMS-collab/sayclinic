const fs = require('fs');
const path = require('path');

// Prehľadávanie možných umiestnení a prípon
const possiblePaths = [
  path.join(process.cwd(), 'MKCH.csv'),
  path.join(process.cwd(), 'MKCH.tsv'),
  path.join(process.cwd(), 'src', 'MKCH.csv'),
  path.join(process.cwd(), 'src', 'MKCH.tsv'),
  path.join(process.cwd(), 'public', 'MKCH.csv'),
  path.join(process.cwd(), 'public', 'MKCH.tsv'),
];

const foundPath = possiblePaths.find((p) => fs.existsSync(p));

if (!foundPath) {
  console.error('❌ Súbor MKCH.csv ani MKCH.tsv sa nenašiel v projekte!');
  console.log('👉 Presuň súbor MKCH.csv / MKCH.tsv do hlavného priečinku (vedľa package.json).');
  process.exit(1);
}

console.log(`🔍 Nájdený súbor: ${foundPath}`);
const fileContent = fs.readFileSync(foundPath, 'utf-8');
const lines = fileContent.split(/\r?\n/);

const isTSV = foundPath.endsWith('.tsv') || lines[0].includes('\t');
const delimiter = isTSV ? '\t' : ',';

const result = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split(delimiter);
  const code = parts[0]?.trim().replace(/^"|"$/g, '');
  const name = parts[parts.length - 1]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"');

  if (code && name && code !== 'DG_3') {
    result.push({ code, name });
  }
}

const outputDir = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'mkch.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

console.log(`✅ Úspešne vytvorený súbor ${outputPath} so ${result.length} diagnózami!`);
