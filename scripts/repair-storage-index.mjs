import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { mkdir, readdir, rename, copyFile, stat, writeFile } from 'node:fs/promises';

const storageDir = process.env.MALIHONG_DATA_DIR
  ? path.resolve(process.env.MALIHONG_DATA_DIR)
  : path.join(os.homedir(), 'Library', 'Application Support', 'malihong', 'storage');
const metadataPath = path.join(storageDir, 'results.json');
const trashMetadataPath = path.join(storageDir, 'trash.json');
const imagesDir = path.join(storageDir, 'images');
const referencesDir = path.join(storageDir, 'references');
const tempPath = `${metadataPath}.repairing`;
const backupPath = `${metadataPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;

function extensionForMime(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

function mimeForFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

async function compactEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.fileName) delete entry.imageBase64;
  const references = Array.isArray(entry.promptReferenceImages) ? entry.promptReferenceImages : [];
  if (references.length > 0) {
    const resultDir = path.join(referencesDir, String(entry.id || crypto.randomUUID()));
    await mkdir(resultDir, { recursive: true });
    const compactReferences = [];
    for (let index = 0; index < references.length; index += 1) {
      const reference = references[index];
      if (reference?.fileName && reference?.mimeType) {
        compactReferences.push({ fileName: path.basename(reference.fileName), mimeType: reference.mimeType });
        continue;
      }
      if (!reference?.data || !reference?.mimeType) continue;
      const fileName = `${index + 1}.${extensionForMime(reference.mimeType)}`;
      await writeFile(path.join(resultDir, fileName), Buffer.from(reference.data, 'base64'));
      compactReferences.push({ fileName, mimeType: reference.mimeType });
    }
    entry.promptReferenceImages = compactReferences;
  }
  return entry;
}

async function* readTopLevelObjects(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
  let current = '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for await (const chunk of stream) {
    for (const char of chunk) {
      if (depth === 0) {
        if (char === '{') {
          depth = 1;
          current = '{';
        }
        continue;
      }
      current += char;
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{' || char === '[') depth += 1;
      else if (char === '}' || char === ']') depth -= 1;
      if (depth === 0) {
        yield current;
        current = '';
      }
    }
  }
  if (depth !== 0) throw new Error('Incomplete results.json object while streaming repair.');
}

async function main() {
  await mkdir(imagesDir, { recursive: true });
  await mkdir(referencesDir, { recursive: true });
  await copyFile(metadataPath, backupPath);

  const output = fs.createWriteStream(tempPath, { encoding: 'utf8' });
  output.write('[\n');
  let first = true;
  let indexed = 0;
  const knownFiles = new Set();

  for await (const rawObject of readTopLevelObjects(metadataPath)) {
    const entry = await compactEntry(JSON.parse(rawObject));
    if (!entry) continue;
    if (entry.fileName) knownFiles.add(entry.fileName);
    if (!first) output.write(',\n');
    output.write(JSON.stringify(entry, null, 2));
    first = false;
    indexed += 1;
  }

  const imageFiles = (await readdir(imagesDir)).filter((name) => !name.startsWith('.'));
  let recovered = 0;
  for (const fileName of imageFiles) {
    if (knownFiles.has(fileName)) continue;
    const fileStats = await stat(path.join(imagesDir, fileName));
    const id = path.basename(fileName, path.extname(fileName));
    const entry = {
      id,
      fileName,
      mimeType: mimeForFile(fileName),
      model: 'recovered',
      requestedModel: 'recovered',
      prompt: 'Recovered from local image file after index repair.',
      createdAt: (fileStats.birthtimeMs > 0 ? fileStats.birthtime : fileStats.mtime).toISOString(),
      settings: {},
      promptReferenceImages: [],
      referenceDiagnostics: null,
      usage: null,
    };
    if (!first) output.write(',\n');
    output.write(JSON.stringify(entry, null, 2));
    first = false;
    recovered += 1;
  }

  output.write('\n]\n');
  await new Promise((resolve, reject) => {
    output.on('error', reject);
    output.end(resolve);
  });
  await rename(tempPath, metadataPath);
  const repairedStats = await stat(metadataPath);

  let trashItems = 0;
  let trashBytes = 0;
  let trashBackupPath = null;
  if (fs.existsSync(trashMetadataPath)) {
    trashBackupPath = `${trashMetadataPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const trashTempPath = `${trashMetadataPath}.repairing`;
    await copyFile(trashMetadataPath, trashBackupPath);
    const trashOutput = fs.createWriteStream(trashTempPath, { encoding: 'utf8' });
    trashOutput.write('[\n');
    let firstTrash = true;
    for await (const rawObject of readTopLevelObjects(trashMetadataPath)) {
      const entry = JSON.parse(rawObject);
      if (entry?.trashLocation && fs.existsSync(entry.trashLocation)) delete entry.imageBase64;
      if (entry?.original) entry.original = await compactEntry(entry.original);
      if (!firstTrash) trashOutput.write(',\n');
      trashOutput.write(JSON.stringify(entry, null, 2));
      firstTrash = false;
      trashItems += 1;
    }
    trashOutput.write('\n]\n');
    await new Promise((resolve, reject) => {
      trashOutput.on('error', reject);
      trashOutput.end(resolve);
    });
    await rename(trashTempPath, trashMetadataPath);
    trashBytes = (await stat(trashMetadataPath)).size;
  }

  console.log(JSON.stringify({
    indexed,
    recovered,
    total: indexed + recovered,
    bytes: repairedStats.size,
    backupPath,
    trashItems,
    trashBytes,
    trashBackupPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
