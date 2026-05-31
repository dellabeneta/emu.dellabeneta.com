#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const BUCKET = 'emu.dellabeneta.com'; 

const folderMap = {
  'Nintendo': 'nes',
  'Super Nintendo': 'snes',
  'Master System': 'master',
  'Mega Drive': 'mega',
  'Game Boy': 'gb',
  'Game Boy Color': 'gbc',
  'Game Boy Advance': 'gba',
  'PlayStation 1': 'psx',
  'Nintendo 64': 'n64',
  'Arcade Classics': 'fbneo',
  'Capcom CPS-1': 'cps1',
  'Capcom CPS-2': 'cps2',
  'Capcom CPS-3': 'cps3',
  'Neo Geo MVS': 'neogeo',
};

function loadPlatforms() {
  const content = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const end = content.indexOf('\nconst desc_en');
  const code = content.substring(0, end);
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code.replace('const PLATFORMS', 'PLATFORMS'), ctx);
  return ctx.PLATFORMS;
}

function loadS3Objects() {
  try {
    const out = execSync(`aws s3 ls s3://${BUCKET}/roms/ --recursive`, { encoding: 'utf8' });
    return new Set(
      out.trim().split('\n')
        .filter(Boolean)
        .map(line => line.trim().split(/\s+/).pop()) // extrai o key (caminho)
    );
  } catch (e) {
    console.error('Erro ao listar o S3. Verifique as credenciais AWS.');
    process.exit(1);
  }
}

const useS3 = !fs.existsSync(path.join(ROOT, 'roms'));
const mode = useS3 ? 'S3' : 'disco local';

let pass = 0;
let fail = 0;

function ok(msg)    { console.log(`\x1b[32m✔ ${msg}\x1b[0m`); pass++; }
function error(msg) { console.log(`\x1b[31m✘ ${msg}\x1b[0m`); fail++; }

console.log('\n═══════════════════════════════════════════');
console.log(`  RetroVault — Testes de Catálogo [${mode}]`);
console.log('═══════════════════════════════════════════\n');

const PLATFORMS = loadPlatforms();
const s3Objects = useS3 ? loadS3Objects() : null;

for (const platform of PLATFORMS) {
  const folder = folderMap[platform.name];

  if (!folder) {
    error(`Plataforma sem pasta mapeada: "${platform.name}"`);
    continue;
  }

  for (const game of platform.games) {
    const ref = game.file;
    const label = `[${platform.name}] ${game.title}`;

    // Regra 1: referência deve ter extensão explícita
    if (path.extname(ref) === '') {
      error(`${label} — sem extensão: file: "${ref}"`);
      continue;
    }

    // Regra 2: arquivo deve existir (disco ou S3)
    if (useS3) {
      const key = `roms/${folder}/${ref}`;
      if (s3Objects.has(key)) {
        ok(`${label} → s3://${BUCKET}/${key}`);
      } else {
        error(`${label} — não encontrado no S3: ${key}`);
      }
    } else {
      const fullPath = path.join(ROOT, 'roms', folder, ref);
      if (fs.existsSync(fullPath)) {
        ok(`${label} → roms/${folder}/${ref}`);
      } else {
        error(`${label} — arquivo não encontrado: roms/${folder}/${ref}`);
      }
    }
  }
}

console.log('\n═══════════════════════════════════════════');
console.log(`  Resultado: ${pass} passou(aram) | ${fail} falhou(aram)`);
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
