import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFile, stat, writeFile, mkdir, rename, copyFile, unlink, access } from 'node:fs/promises';
import dotenv from 'dotenv';
import { GoogleGenAI, MediaResolution } from '@google/genai';
import OpenAI, { toFile } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const storageDir = process.env.MALIHONG_DATA_DIR
  ? path.resolve(process.env.MALIHONG_DATA_DIR)
  : path.join(__dirname, 'storage');
const imagesDir = path.join(storageDir, 'images');
const referencesDir = path.join(storageDir, 'references');
const fallbackTrashDir = path.join(storageDir, 'trash');
const metadataPath = path.join(storageDir, 'results.json');
const trashMetadataPath = path.join(storageDir, 'trash.json');
const sharedSettingsDir = path.join(os.homedir(), '.malihong');
const projectMetadataPath = path.join(sharedSettingsDir, 'projects.json');
const usageMetadataPath = path.join(sharedSettingsDir, 'usage.json');

const envCandidates = [
  process.env.MALIHONG_ENV_FILE,
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env'),
].filter(Boolean);

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MAX_BODY_BYTES = 50 * 1024 * 1024;
let persistedResults = [];
let trashedResults = [];
let persistedProjectState = null;
let persistedUsageState = null;

function sanitizeProjectState(input) {
  const source = input && typeof input === 'object' ? input : {};
  const projects = Array.isArray(source.projects)
    ? source.projects
        .filter((project) => project && typeof project === 'object' && project.id)
        .map((project) => ({
          id: String(project.id),
          name: String(project.name || 'Project'),
          createdAt: project.createdAt || new Date().toISOString(),
        }))
    : [];
  const validProjectIds = new Set(projects.map((project) => project.id));
  const assignments = {};
  if (source.assignments && typeof source.assignments === 'object') {
    for (const [resultId, projectId] of Object.entries(source.assignments)) {
      if (resultId && validProjectIds.has(String(projectId))) {
        assignments[String(resultId)] = String(projectId);
      }
    }
  }
  const requestedActiveId = typeof source.activeProjectId === 'string' ? source.activeProjectId : 'all';
  return {
    activeProjectId: requestedActiveId === 'all' || validProjectIds.has(requestedActiveId)
      ? requestedActiveId
      : 'all',
    projects,
    assignments,
  };
}

function sanitizeUsageState(input) {
  if (!input || typeof input !== 'object') return null;
  const entries = Array.isArray(input.entries)
    ? input.entries
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
          id: String(entry.id || `${Date.now()}-${crypto.randomUUID()}`),
          createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
          modelId: typeof entry.modelId === 'string' ? entry.modelId : 'unknown',
          count: Math.max(1, Number(entry.count || 1)),
          cost: Math.max(0, Number(entry.cost || 0)),
          imageTier: typeof entry.imageTier === 'string' ? entry.imageTier : null,
          source: typeof entry.source === 'string' ? entry.source : 'live',
          tokens: {
            prompt: Math.max(0, Number(entry.tokens?.prompt || 0)),
            output: Math.max(0, Number(entry.tokens?.output || 0)),
            total: Math.max(0, Number(entry.tokens?.total || 0)),
          },
        }))
    : [];
  const legacy = input.migratedLegacy && typeof input.migratedLegacy === 'object'
    ? {
        nb: Math.max(0, Number(input.migratedLegacy.nb || 0)),
        pro: Math.max(0, Number(input.migratedLegacy.pro || 0)),
        nb2: Math.max(0, Number(input.migratedLegacy.nb2 || 0)),
        promptTokens: Math.max(0, Number(input.migratedLegacy.promptTokens || 0)),
        outputTokens: Math.max(0, Number(input.migratedLegacy.outputTokens || 0)),
        totalTokens: Math.max(0, Number(input.migratedLegacy.totalTokens || 0)),
        totalPrompts: Math.max(0, Number(input.migratedLegacy.totalPrompts || 0)),
      }
    : null;
  return {
    startedAt: typeof input.startedAt === 'string' ? input.startedAt : null,
    entries,
    migratedLegacy: legacy,
  };
}

async function ensureStorage() {
  await mkdir(imagesDir, { recursive: true });
  await mkdir(referencesDir, { recursive: true });
  await mkdir(fallbackTrashDir, { recursive: true });
  await mkdir(sharedSettingsDir, { recursive: true });
  try {
    const raw = await readFile(metadataPath, 'utf8');
    const parsed = JSON.parse(raw);
    persistedResults = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new Error(`Could not load results index safely: ${error?.message || error}`);
    }
    persistedResults = [];
    await writeFile(metadataPath, JSON.stringify(persistedResults, null, 2), 'utf8');
  }
  try {
    const raw = await readFile(trashMetadataPath, 'utf8');
    const parsed = JSON.parse(raw);
    trashedResults = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new Error(`Could not load trash index safely: ${error?.message || error}`);
    }
    trashedResults = [];
    await writeFile(trashMetadataPath, JSON.stringify(trashedResults, null, 2), 'utf8');
  }
  try {
    const raw = await readFile(projectMetadataPath, 'utf8');
    persistedProjectState = sanitizeProjectState(JSON.parse(raw)?.state);
  } catch {
    persistedProjectState = null;
  }
  try {
    const raw = await readFile(usageMetadataPath, 'utf8');
    persistedUsageState = sanitizeUsageState(JSON.parse(raw)?.state);
  } catch {
    persistedUsageState = null;
  }
}

async function persistResultsFile() {
  for (const entry of persistedResults) {
    if (entry?.fileName) delete entry.imageBase64;
    if (Array.isArray(entry?.promptReferenceImages)) {
      entry.promptReferenceImages = await persistPromptReferenceImages(entry.id, entry.promptReferenceImages);
    }
  }
  await writeFile(metadataPath, JSON.stringify(persistedResults, null, 2), 'utf8');
}

async function persistTrashFile() {
  for (const entry of trashedResults) {
    if (entry?.trashLocation) delete entry.imageBase64;
    if (entry?.original?.fileName) delete entry.original.imageBase64;
  }
  await writeFile(trashMetadataPath, JSON.stringify(trashedResults, null, 2), 'utf8');
}

async function persistProjectStateFile() {
  await writeFile(
    projectMetadataPath,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), state: persistedProjectState }, null, 2),
    'utf8',
  );
}

async function persistUsageStateFile() {
  await writeFile(
    usageMetadataPath,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), state: persistedUsageState }, null, 2),
    'utf8',
  );
}

function mimeToExt(mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

async function persistPromptReferenceImages(resultId, references) {
  if (!Array.isArray(references) || references.length === 0) return [];
  const resultDir = path.join(referencesDir, String(resultId));
  await mkdir(resultDir, { recursive: true });
  const saved = [];
  for (let index = 0; index < references.length; index += 1) {
    const reference = references[index];
    if (reference?.fileName && reference?.mimeType) {
      saved.push({ fileName: path.basename(reference.fileName), mimeType: reference.mimeType });
      continue;
    }
    if (!reference?.data || !reference?.mimeType) continue;
    const fileName = `${index + 1}.${mimeToExt(reference.mimeType)}`;
    await writeFile(path.join(resultDir, fileName), Buffer.from(reference.data, 'base64'));
    saved.push({ fileName, mimeType: reference.mimeType });
  }
  return saved;
}

async function loadPromptReferenceImages(entry) {
  const references = Array.isArray(entry?.promptReferenceImages) ? entry.promptReferenceImages : [];
  const loaded = [];
  for (const reference of references) {
    if (reference?.data && reference?.mimeType) {
      loaded.push({ mimeType: reference.mimeType, dataUrl: `data:${reference.mimeType};base64,${reference.data}` });
      continue;
    }
    if (!reference?.fileName || !reference?.mimeType) continue;
    try {
      const bytes = await readFile(path.join(referencesDir, String(entry.id), path.basename(reference.fileName)));
      loaded.push({ mimeType: reference.mimeType, dataUrl: `data:${reference.mimeType};base64,${bytes.toString('base64')}` });
    } catch {
      // Keep the result usable even if one old reference file is unavailable.
    }
  }
  return loaded;
}

function toPublicResult(entry, options = {}) {
  const imageUrl = entry.fileName ? `/api/images/${entry.fileName}` : null;
  const imageDataUrl =
    entry.imageBase64 && entry.mimeType ? `data:${entry.mimeType};base64,${entry.imageBase64}` : null;
  const { imageBase64, promptReferenceImages: _promptReferenceImages, ...publicEntry } = entry;
  return {
    ...publicEntry,
    imageUrl,
    imageDataUrl: imageUrl ? null : imageDataUrl,
    promptReferenceImages: [],
    promptReferenceImageCount: Array.isArray(entry.promptReferenceImages)
      ? entry.promptReferenceImages.length
      : 0,
  };
}

async function toPublicResultWithReferences(entry) {
  return {
    ...toPublicResult(entry),
    promptReferenceImages: await loadPromptReferenceImages(entry),
  };
}

function toPublicTrashItem(entry) {
  const { imageBase64, promptReferenceImages, ...publicOriginal } = entry.original || {};
  return {
    id: entry.id,
    trashedAt: entry.trashedAt,
    trashLocation: entry.trashLocation || null,
    fileName: entry.fileName || null,
    originalProjectId: entry.originalProjectId || 'all',
    original: {
      ...publicOriginal,
      imageDataUrl: null,
      imageUrl: `/api/trash/${encodeURIComponent(entry.id)}/image`,
      promptReferenceImages: [],
      promptReferenceImageCount: Array.isArray(promptReferenceImages)
        ? promptReferenceImages.length
        : 0,
    },
  };
}

function isOpenAiModel(model) {
  return model === 'gpt-image-2';
}

function normalizeRequestedModel(raw) {
  const model = typeof raw === 'string' ? raw.trim() : '';
  if (!model || model === 'recovered' || model === 'unknown') {
    return '';
  }
  if (model === 'gemini-2.5-flash-image-preview') {
    return 'gemini-3-pro-image-preview';
  }
  if (model === 'gemini-3.1-flash-image') {
    return 'gemini-3.1-flash-image-preview';
  }
  return model;
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function moveToTrash(filePath, fileName) {
  const homeTrashDir = path.join(os.homedir(), '.Trash');
  const targetName = `${Date.now()}-${fileName}`;
  const trashPath = path.join(homeTrashDir, targetName);

  try {
    await access(homeTrashDir);
    await rename(filePath, trashPath);
    return { moved: true, location: trashPath };
  } catch {
    try {
      await access(homeTrashDir);
      await copyFile(filePath, trashPath);
      await unlink(filePath);
      return { moved: true, location: trashPath };
    } catch {
      const fallbackPath = path.join(fallbackTrashDir, targetName);
      try {
        await rename(filePath, fallbackPath);
        return { moved: true, location: fallbackPath, fallback: true };
      } catch {
        try {
          await copyFile(filePath, fallbackPath);
          await unlink(filePath);
          return { moved: true, location: fallbackPath, fallback: true };
        } catch {
          return { moved: false, location: null };
        }
      }
    }
  }
}

async function removeTrashedFile(trashLocation) {
  if (!trashLocation) return false;
  try {
    await unlink(trashLocation);
    return true;
  } catch {
    return false;
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (tooLarge) {
        return;
      }
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new Error('Payload too large'));
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function getOpenAiSizeFromOptions(imageSize, aspectRatio) {
  const match = /^(\d+)x(\d+)$/.exec(String(imageSize || ''));
  if (match) {
    const width = Number(match[1]);
    const height = Number(match[2]);
    const longEdge = Math.max(width, height);
    const shortEdge = Math.min(width, height);
    const pixels = width * height;
    const valid =
      width % 16 === 0 &&
      height % 16 === 0 &&
      longEdge <= 3840 &&
      longEdge / shortEdge <= 3 &&
      pixels >= 655360 &&
      pixels <= 8294400;
    if (valid) return `${width}x${height}`;
  }
  if (aspectRatio === '2:3' || aspectRatio === '9:16') return '1024x1536';
  if (aspectRatio === '3:2' || aspectRatio === '16:9' || aspectRatio === '21:9') return '1536x1024';
  return '1024x1024';
}

async function generateWithOpenAi({ apiKey, prompt, model, images, imageSize, clarity, aspectRatio, forceRefUse, diagnostics }) {
  const client = new OpenAI({ apiKey });
  const size = getOpenAiSizeFromOptions(imageSize, aspectRatio);
  const quality = clarity || 'medium';
  let response;

  if (images.length > 0) {
    const files = await Promise.all(
      images.map((image, index) =>
        toFile(Buffer.from(image.data, 'base64'), `reference-${index + 1}.${mimeToExt(image.mimeType)}`, {
          type: image.mimeType,
        })
      )
    );
    response = await client.images.edit({
      model,
      prompt,
      image: files,
      size,
      quality,
    });
  } else {
    response = await client.images.generate({
      model,
      prompt,
      size,
      quality,
    });
  }

  const first = Array.isArray(response?.data) ? response.data[0] : null;
  const base64 = first?.b64_json || null;
  const mimeType = 'image/png';
  return {
    outputImages: base64 ? [{ data: base64, mimeType }] : [],
    text: first?.revised_prompt || null,
    usage: response?.usage
      ? {
          promptTokenCount: response.usage?.input_tokens ?? null,
          candidatesTokenCount: response.usage?.output_tokens ?? null,
          totalTokenCount: response.usage?.total_tokens ?? null,
        }
      : null,
    effectiveModel: model,
    response,
    appliedOptions: {
      aspectRatio: aspectRatio || null,
      imageSize: size,
      clarity: quality,
      forceRefUse,
    },
    referenceStrategy: images.length > 0 ? 'direct-edit' : 'prompt-only',
  };
}

async function handleGenerate(req, res) {
  const runtimeApiKeyHeader = req.headers['x-google-api-key'];
  const runtimeApiKey =
    typeof runtimeApiKeyHeader === 'string' ? runtimeApiKeyHeader.trim() : '';
  const runtimeOpenAiApiKeyHeader = req.headers['x-openai-api-key'];
  const runtimeOpenAiApiKey =
    typeof runtimeOpenAiApiKeyHeader === 'string' ? runtimeOpenAiApiKeyHeader.trim() : '';

  let body;
  try {
    body = await readRequestBody(req);
  } catch (err) {
    if (err?.message === 'Payload too large') {
      sendJson(res, 413, {
        error: `Payload too large. Keep total request under ${Math.floor(
          MAX_BODY_BYTES / (1024 * 1024)
        )}MB.`,
      });
      return;
    }
    sendJson(res, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const prompt = (body.prompt || '').trim();
  const requestedModel = (body.model || '').trim();
  let model = normalizeRequestedModel(requestedModel);
  const images = Array.isArray(body.images)
    ? body.images
    : body.image
      ? [body.image]
      : [];
  const options = body.options || {};
  const aspectRatio = typeof options.aspectRatio === 'string' ? options.aspectRatio.trim() : '';
  const imageSize = typeof options.imageSize === 'string' ? options.imageSize.trim() : '';
  const clarity = typeof options.clarity === 'string' ? options.clarity.trim().toLowerCase() : '';
  const forceRefUse = images.length > 0;

  if (!prompt) {
    sendJson(res, 400, { error: 'Prompt is required.' });
    return;
  }

  if (!model) {
    sendJson(res, 400, { error: 'Model is required.' });
    return;
  }

  const isOpenAi = isOpenAiModel(model);
  const apiKey = isOpenAi
    ? runtimeOpenAiApiKey || process.env.OPENAI_API_KEY || ''
    : runtimeApiKey || process.env.GOOGLE_API_KEY || '';

  if (!apiKey) {
    sendJson(res, 500, {
      error: isOpenAi
        ? 'Missing OpenAI API key. Set OPENAI_API_KEY in .env or paste key in the UI.'
        : 'Missing Google API key. Set GOOGLE_API_KEY in .env or paste key in the UI.',
    });
    return;
  }

  const diagnostics = {
    receivedCount: 0,
    rejectedCount: 0,
    totalBytes: 0,
    hashes: [],
    forced: forceRefUse,
    guideApplied: false,
    sentPartsCount: 0,
    promptChars: prompt.length,
  };

  const parts = [{ text: prompt }];

  const validReferenceParts = [];
  for (const image of images) {
    if (image && image.data && image.mimeType) {
      let decoded;
      try {
        decoded = Buffer.from(image.data, 'base64');
      } catch {
        diagnostics.rejectedCount += 1;
        continue;
      }
      if (!decoded || decoded.length === 0) {
        diagnostics.rejectedCount += 1;
        continue;
      }
      diagnostics.receivedCount += 1;
      diagnostics.totalBytes += decoded.length;
      diagnostics.hashes.push(crypto.createHash('sha256').update(decoded).digest('hex').slice(0, 12));
      const inlinePart = {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      };
      validReferenceParts.push(inlinePart);
      parts.push(inlinePart);
    } else {
      diagnostics.rejectedCount += 1;
    }
  }

  diagnostics.sentPartsCount = parts.length;

  if (images.length > 0 && diagnostics.receivedCount === 0) {
    sendJson(res, 400, {
      error: 'Reference images were provided, but none were valid base64 image payloads.',
      requestedModel,
      referenceDiagnostics: diagnostics,
    });
    return;
  }

  try {
    if (isOpenAi) {
      const openAiResponse = await generateWithOpenAi({
        apiKey,
        prompt,
        model,
        images,
        imageSize,
        clarity,
        aspectRatio,
        forceRefUse,
        diagnostics,
      });
      const usage = openAiResponse.usage || null;
      const outputImages = openAiResponse.outputImages;
      const textOutput = openAiResponse.text || null;
      if (outputImages.length === 0) {
        sendJson(res, 502, {
          error: 'No image returned by model.',
          model,
          effectiveModel: openAiResponse.effectiveModel,
          requestedModel,
          referenceDiagnostics: diagnostics,
          text: textOutput,
          appliedOptions: openAiResponse.appliedOptions,
        });
        return;
      }

      const firstGenerated = outputImages[0];
      const id = `${Date.now()}-${crypto.randomUUID()}`;
      const resultEntry = {
        id,
        fileName: null,
        mimeType: firstGenerated.mimeType || 'image/png',
        imageBase64: firstGenerated.data,
        model: openAiResponse.effectiveModel,
        requestedModel,
        prompt,
        createdAt: new Date().toISOString(),
        settings: openAiResponse.appliedOptions,
        promptReferenceImages: images.map((item) => ({
          mimeType: item.mimeType,
          data: item.data,
        })),
        referenceDiagnostics: diagnostics,
        usage,
      };
      try {
        const ext = mimeToExt(firstGenerated.mimeType || 'image/png');
        const fileName = `${id}.${ext}`;
        const filePath = path.join(imagesDir, fileName);
        await writeFile(filePath, Buffer.from(firstGenerated.data, 'base64'));
        resultEntry.fileName = fileName;
      } catch {
        resultEntry.fileName = null;
      }
      persistedResults.unshift(resultEntry);
      await persistResultsFile();
      sendJson(res, 200, {
        model: openAiResponse.effectiveModel,
        requestedModel,
        text: textOutput,
        images: outputImages,
        referenceImageCount: images.length,
        appliedOptions: openAiResponse.appliedOptions,
        referenceDiagnostics: diagnostics,
        referenceStrategy: openAiResponse.referenceStrategy,
        usage,
        result: toPublicResult(resultEntry),
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    // Keep request minimal to reduce false blocking.
    diagnostics.guideApplied = false;

    const config = {};

    if (aspectRatio || (imageSize && model.startsWith('gemini-3'))) {
      config.imageConfig = {};
      if (aspectRatio) {
        config.imageConfig.aspectRatio = aspectRatio;
      }
      if (imageSize && model.startsWith('gemini-3')) {
        config.imageConfig.imageSize = imageSize;
      }
    }

    if (clarity === 'low') {
      config.mediaResolution = MediaResolution.MEDIA_RESOLUTION_LOW;
    } else if (clarity === 'medium') {
      config.mediaResolution = MediaResolution.MEDIA_RESOLUTION_MEDIUM;
    } else if (clarity === 'high') {
      config.mediaResolution = MediaResolution.MEDIA_RESOLUTION_HIGH;
    }

    const extractOutput = (responseObj) => {
      const extracted = {
        candidates: Array.isArray(responseObj?.candidates) ? responseObj.candidates : [],
        outputImages: [],
        text: '',
      };
      for (const candidate of extracted.candidates) {
        const outParts = candidate?.content?.parts || [];
        for (const part of outParts) {
          const inlineData = part?.inlineData || part?.inline_data || null;
          if (inlineData?.data) {
            extracted.outputImages.push({
              data: inlineData.data,
              mimeType: inlineData.mimeType || inlineData.mime_type || 'image/png',
            });
          }
          if (part?.text) {
            extracted.text += part.text;
          }
        }
      }
      const generatedImages = Array.isArray(responseObj?.generatedImages)
        ? responseObj.generatedImages
        : [];
      for (const item of generatedImages) {
        const bytes = item?.image?.imageBytes || item?.image?.image_bytes;
        if (!bytes) continue;
        extracted.outputImages.push({
          data: bytes,
          mimeType: item?.image?.mimeType || item?.image?.mime_type || 'image/png',
        });
      }
      return extracted;
    };

    let effectiveModel = model;
    let referenceStrategy = 'direct';
    let response = await ai.models.generateContent({
      model: effectiveModel,
      contents: [{ role: 'user', parts }],
      config,
    });
    let { candidates, outputImages, text } = extractOutput(response);

    if (outputImages.length === 0) {
      // Retry on the same model with minimal config to reduce provider-side filtering.
      const retryConfig = {};
      const retryParts = [{ text: prompt }, ...validReferenceParts];
      response = await ai.models.generateContent({
        model: effectiveModel,
        contents: [{ role: 'user', parts: retryParts }],
        config: retryConfig,
      });
      ({ candidates, outputImages, text } = extractOutput(response));
    }

    if (outputImages.length === 0 && model === 'gemini-2.5-flash-image') {
      effectiveModel = 'gemini-3-pro-image-preview';
      response = await ai.models.generateContent({
        model: effectiveModel,
        contents: [{ role: 'user', parts }],
        config,
      });
      ({ candidates, outputImages, text } = extractOutput(response));
    }

    if (
      outputImages.length === 0 &&
      model === 'gemini-3-pro-image-preview' &&
      validReferenceParts.length > 0 &&
      response?.promptFeedback?.blockReason
    ) {
      try {
        const summarize = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    'Describe these reference images for image generation in short bullet points: subject identity traits, clothing, framing, camera angle, lighting, and style. Keep it concise and neutral.',
                },
                ...validReferenceParts,
              ],
            },
          ],
          config: {},
        });
        const summaryText = (summarize?.text || '').trim();
        if (summaryText) {
          diagnostics.guideApplied = true;
          referenceStrategy = 'distilled';
          response = await ai.models.generateContent({
            model: effectiveModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${prompt}\n\nReference traits (from your uploaded photos):\n${summaryText}`,
                  },
                ],
              },
            ],
            config: {},
          });
          ({ candidates, outputImages, text } = extractOutput(response));
        }
      } catch {
        // Keep original blocked response diagnostics.
      }
    }

    const usage = response?.usageMetadata
      ? {
          promptTokenCount: response.usageMetadata.promptTokenCount ?? null,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount ?? null,
          totalTokenCount: response.usageMetadata.totalTokenCount ?? null,
        }
      : null;

    if (outputImages.length === 0) {
      sendJson(res, 502, {
        error: 'No image returned by model.',
        model,
        effectiveModel,
        requestedModel,
        usedAllReferences: diagnostics.receivedCount === images.length && images.length > 0,
        receivedReferences: diagnostics.receivedCount,
        sentReferences: images.length,
        candidateCount: candidates.length,
        finishReasons: candidates.map((item) => item?.finishReason).filter(Boolean),
        blockReason: response?.promptFeedback?.blockReason || null,
        modelVersion: response?.modelVersion || null,
        referenceStrategy,
        text: text || null,
        referenceDiagnostics: diagnostics,
        appliedOptions: {
          aspectRatio: aspectRatio || null,
          imageSize: imageSize && model.startsWith('gemini-3') ? imageSize : null,
          clarity: clarity || null,
        },
      });
      return;
    }

    const firstGenerated = outputImages[0] || null;
    let savedResult = null;
    if (firstGenerated?.data) {
      const id = `${Date.now()}-${crypto.randomUUID()}`;
      const resultEntry = {
        id,
        fileName: null,
        mimeType: firstGenerated.mimeType || 'image/png',
        imageBase64: firstGenerated.data,
        model: effectiveModel,
        requestedModel,
        prompt,
        createdAt: new Date().toISOString(),
        settings: {
          aspectRatio: aspectRatio || null,
          imageSize: imageSize || null,
          clarity: clarity || null,
          forceRefUse,
        },
        promptReferenceImages: images.map((item) => ({
          mimeType: item.mimeType,
          data: item.data,
        })),
        referenceDiagnostics: diagnostics,
        usage,
      };
      try {
        const ext = mimeToExt(firstGenerated.mimeType || 'image/png');
        const fileName = `${id}.${ext}`;
        const filePath = path.join(imagesDir, fileName);
        await writeFile(filePath, Buffer.from(firstGenerated.data, 'base64'));
        resultEntry.fileName = fileName;
      } catch {
        resultEntry.fileName = null;
      }
      persistedResults.unshift(resultEntry);
      await persistResultsFile();
      savedResult = toPublicResult(resultEntry);
    }

    sendJson(res, 200, {
      model: effectiveModel,
      requestedModel,
      text: text || null,
      images: outputImages,
      referenceImageCount: images.length,
      appliedOptions: {
        aspectRatio: aspectRatio || null,
        imageSize: imageSize && model.startsWith('gemini-3') ? imageSize : null,
        clarity: clarity || null,
      },
      referenceDiagnostics: diagnostics,
      referenceStrategy,
      usage,
      result: savedResult,
    });
  } catch (err) {
    sendJson(res, 500, { error: err?.message || 'Generation failed.' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        hasGoogleApiKey: Boolean(process.env.GOOGLE_API_KEY),
        hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
        persistedResults: persistedResults.length,
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/projects') {
      sendJson(res, 200, { state: persistedProjectState });
      return;
    }

    if (req.method === 'PUT' && req.url === '/api/projects') {
      let body;
      try {
        body = await readRequestBody(req);
      } catch {
        sendJson(res, 400, { error: 'Invalid project state.' });
        return;
      }
      persistedProjectState = sanitizeProjectState(body?.state);
      await persistProjectStateFile();
      sendJson(res, 200, { ok: true, state: persistedProjectState });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/usage') {
      sendJson(res, 200, { state: persistedUsageState });
      return;
    }

    if (req.method === 'PUT' && req.url === '/api/usage') {
      let body;
      try {
        body = await readRequestBody(req);
      } catch {
        sendJson(res, 400, { error: 'Invalid usage ledger.' });
        return;
      }
      persistedUsageState = sanitizeUsageState(body?.state);
      if (!persistedUsageState) {
        sendJson(res, 400, { error: 'Invalid usage ledger.' });
        return;
      }
      await persistUsageStateFile();
      sendJson(res, 200, { ok: true, state: persistedUsageState });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/results') {
      sendJson(res, 200, {
        results: persistedResults.map(toPublicResult),
      });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/results/')) {
      const id = decodeURIComponent(req.url.replace('/api/results/', ''));
      const target = persistedResults.find((item) => item.id === id);
      if (!target) {
        sendJson(res, 404, { error: 'Result not found.' });
        return;
      }
      sendJson(res, 200, {
        result: await toPublicResultWithReferences(target),
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/trash') {
      sendJson(res, 200, {
        items: trashedResults.map(toPublicTrashItem),
      });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/trash/') && req.url?.endsWith('/image')) {
      const id = decodeURIComponent(req.url.replace('/api/trash/', '').replace('/image', ''));
      const target = trashedResults.find((item) => item.id === id);
      if (!target?.imageBase64 && !target?.trashLocation) {
        sendText(res, 404, 'Trash image not found');
        return;
      }
      let buffer;
      try {
        buffer = target.imageBase64
          ? Buffer.from(target.imageBase64, 'base64')
          : await readFile(target.trashLocation);
      } catch {
        sendText(res, 404, 'Trash image not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': target.mimeType || 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'private, max-age=3600',
      });
      res.end(buffer);
      return;
    }

    if (req.method === 'DELETE' && req.url?.startsWith('/api/results/')) {
      const id = decodeURIComponent(req.url.replace('/api/results/', ''));
      const idx = persistedResults.findIndex((item) => item.id === id);
      if (idx < 0) {
        sendJson(res, 404, { error: 'Result not found.' });
        return;
      }
      const originalProjectIdHeader = req.headers['x-project-id'];
      const originalProjectId = typeof originalProjectIdHeader === 'string' && originalProjectIdHeader.trim() ? originalProjectIdHeader.trim() : 'all';
      const [target] = persistedResults.splice(idx, 1);
      let trashResult = { moved: false, location: null };
      if (target.fileName) {
        const imagePath = path.join(imagesDir, target.fileName);
        trashResult = await moveToTrash(imagePath, target.fileName);
      }
      await persistResultsFile();
      trashedResults.unshift({
        id: `trash-${Date.now()}-${crypto.randomUUID()}`,
        trashedAt: new Date().toISOString(),
        trashLocation: trashResult.location,
        fileName: target.fileName || null,
        mimeType: target.mimeType || 'image/png',
        imageBase64: trashResult.location ? null : target.imageBase64 || null,
        originalProjectId,
        original: target,
      });
      await persistTrashFile();
      sendJson(res, 200, {
        ok: true,
        trashed: trashResult.moved,
        trashLocation: trashResult.location,
      });
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith('/api/trash/') && req.url?.endsWith('/restore')) {
      const id = decodeURIComponent(req.url.replace('/api/trash/', '').replace('/restore', ''));
      const idx = trashedResults.findIndex((item) => item.id === id);
      if (idx < 0) {
        sendJson(res, 404, { error: 'Trash item not found.' });
        return;
      }
      const [target] = trashedResults.splice(idx, 1);
      const original = target.original || {};
      let restored = {
        ...original,
      };
      if (target.imageBase64 || target.trashLocation) {
        const fileName =
          original.fileName || `${original.id || `${Date.now()}-${crypto.randomUUID()}`}.${mimeToExt(target.mimeType)}`;
        const filePath = path.join(imagesDir, fileName);
        if (target.imageBase64) {
          await writeFile(filePath, Buffer.from(target.imageBase64, 'base64'));
        } else {
          try {
            await rename(target.trashLocation, filePath);
          } catch {
            await copyFile(target.trashLocation, filePath);
            await unlink(target.trashLocation).catch(() => {});
          }
        }
        restored = {
          ...restored,
          fileName,
          mimeType: target.mimeType || original.mimeType || 'image/png',
        };
      }
      persistedResults.push(restored);
      persistedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await persistResultsFile();
      await persistTrashFile();
      if (target.trashLocation && target.imageBase64) {
        await removeTrashedFile(target.trashLocation);
      }
      sendJson(res, 200, {
        ok: true,
        result: toPublicResult(restored),
        originalProjectId: target.originalProjectId || 'all',
      });
      return;
    }

    if (req.method === 'DELETE' && req.url?.startsWith('/api/trash/')) {
      const id = decodeURIComponent(req.url.replace('/api/trash/', ''));
      if (id === 'clear') {
        for (const item of trashedResults) {
          if (item.trashLocation) {
            await removeTrashedFile(item.trashLocation);
          }
        }
        trashedResults = [];
        await persistTrashFile();
        sendJson(res, 200, { ok: true, cleared: true });
        return;
      }
      const idx = trashedResults.findIndex((item) => item.id === id);
      if (idx < 0) {
        sendJson(res, 404, { error: 'Trash item not found.' });
        return;
      }
      const [target] = trashedResults.splice(idx, 1);
      if (target.trashLocation) {
        await removeTrashedFile(target.trashLocation);
      }
      await persistTrashFile();
      sendJson(res, 200, { ok: true, deleted: true });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/results/import') {
      let body;
      try {
        body = await readRequestBody(req);
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
      }
      const items = Array.isArray(body?.items) ? body.items : [];
      let imported = 0;
      for (const item of items) {
        const parsed = parseDataUrl(item?.imageDataUrl);
        if (!parsed?.data) continue;
        try {
          const id = `${Date.now()}-${crypto.randomUUID()}`;
          const ext = mimeToExt(parsed.mimeType || 'image/png');
          const fileName = `${id}.${ext}`;
          const filePath = path.join(imagesDir, fileName);
          await writeFile(filePath, Buffer.from(parsed.data, 'base64'));
          persistedResults.push({
            id,
            fileName,
            mimeType: parsed.mimeType || 'image/png',
            model: item?.model || 'unknown',
            requestedModel: item?.requestedModel || item?.model || 'unknown',
            prompt: item?.prompt || '',
            createdAt: item?.createdAt || new Date().toISOString(),
            settings: item?.settings || {},
            promptReferenceImages: Array.isArray(item?.promptReferenceImages)
              ? item.promptReferenceImages
                  .map((ref) => {
                    const parsedRef = parseDataUrl(ref?.dataUrl || '');
                    if (!parsedRef?.data || !parsedRef?.mimeType) return null;
                    return {
                      mimeType: parsedRef.mimeType,
                      data: parsedRef.data,
                    };
                  })
                  .filter(Boolean)
              : [],
            referenceDiagnostics: item?.referenceDiagnostics || null,
          });
          imported += 1;
        } catch {
          // skip failed item
        }
      }
      persistedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await persistResultsFile();
      sendJson(res, 200, { ok: true, imported });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/images/')) {
      const fileName = decodeURIComponent(req.url.replace('/api/images/', ''));
      const safeName = path.basename(fileName);
      const filePath = path.join(imagesDir, safeName);
      if (!filePath.startsWith(imagesDir)) {
        sendText(res, 403, 'Forbidden');
        return;
      }
      try {
        const file = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(file);
      } catch {
        sendText(res, 404, 'Not found');
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/generate') {
      await handleGenerate(req, res);
      return;
    }

    if (req.method === 'GET') {
      const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
      const safePath = path.normalize(requestPath).replace(/^\.+/, '');
      const filePath = path.join(publicDir, safePath === '/' ? 'index.html' : safePath);

      if (!filePath.startsWith(publicDir)) {
        sendText(res, 403, 'Forbidden');
        return;
      }

      try {
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
          sendText(res, 404, 'Not found');
          return;
        }
        const file = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(file);
      } catch {
        sendText(res, 404, 'Not found');
      }
      return;
    }

    sendText(res, 405, 'Method not allowed');
  } catch (err) {
    sendJson(res, 500, { error: err?.message || 'Server error.' });
  }
});

export const serverReady = ensureStorage().then(
  () =>
    new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, '127.0.0.1', () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : PORT;
        // eslint-disable-next-line no-console
        console.log(`malihong running on http://127.0.0.1:${port}`);
        resolve({ server, port });
      });
    }),
);

serverReady.catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize malihong storage', err);
  process.exitCode = 1;
});

export { server };
