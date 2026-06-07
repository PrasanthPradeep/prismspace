const fs = require('fs/promises');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const OUT_DIR = path.join(PROJECT_ROOT, 'out');
const EXTENSION_DIR = path.join(PROJECT_ROOT, 'extension');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const NEXT_PUBLIC_DIR = path.join(OUT_DIR, '_next');
const RENAMED_NEXT_DIR = path.join(OUT_DIR, 'next');
const ICON_SIZES = [16, 48, 128];
const FALLBACK_ICON = path.join(PUBLIC_DIR, 'images', 'BG.png');
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureIcons() {
  await fs.mkdir(ICONS_DIR, { recursive: true });

  const fallbackExists = await fileExists(FALLBACK_ICON);

  for (const size of ICON_SIZES) {
    const iconPath = path.join(ICONS_DIR, `icon${size}.png`);

    if (await fileExists(iconPath)) {
      continue;
    }

    if (!fallbackExists) {
      throw new Error(
        `Missing ${iconPath}. Add icons to public/icons or provide ${FALLBACK_ICON} for fallback generation.`,
      );
    }

    await fs.copyFile(FALLBACK_ICON, iconPath);
  }
}

async function walkDirectory(dirPath, onFile) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(entryPath, onFile);
      continue;
    }

    if (entry.isFile()) {
      await onFile(entryPath);
    }
  }
}

async function renameNextAssets() {
  if (!(await fileExists(NEXT_PUBLIC_DIR))) {
    return;
  }

  if (await fileExists(RENAMED_NEXT_DIR)) {
    await fs.rm(RENAMED_NEXT_DIR, { recursive: true, force: true });
  }

  await fs.rename(NEXT_PUBLIC_DIR, RENAMED_NEXT_DIR);
}

async function rewriteNextReferences() {
  const searchPattern = /\/_next\//g;

  await walkDirectory(OUT_DIR, async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (!TEXT_EXTENSIONS.has(ext)) {
      return;
    }

    const contents = await fs.readFile(filePath, 'utf8');
    const updated = contents.replace(searchPattern, '/next/');

    if (updated !== contents) {
      await fs.writeFile(filePath, updated);
    }
  });
}

async function extractInlineScripts() {
  const indexPath = path.join(OUT_DIR, 'index.html');

  if (!(await fileExists(indexPath))) {
    return;
  }

  let html = await fs.readFile(indexPath, 'utf8');
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

  // First pass: collect all scripts
  const scripts = [];
  let match;
  const regex = new RegExp(inlineScriptRegex);

  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  if (scripts.length === 0) {
    return;
  }

  const scriptsDir = path.join(OUT_DIR, 'scripts');
  await fs.mkdir(scriptsDir, { recursive: true });

  let scriptCounter = 0;

  // Second pass: replace inline scripts with external references
  let updatedHtml = html.replace(inlineScriptRegex, (match, content) => {
    // Skip Next.js internal hydration scripts - keep them inline but extract non-Next.js
    if (
      content.includes('__NEXT') ||
      content.includes('self.__next') ||
      content.includes('__NEXTJS')
    ) {
      return match;
    }

    const scriptFile = `inline-${scriptCounter}.js`;
    const scriptPath = path.join(scriptsDir, scriptFile);

    // Write script to file synchronously (we need to do this during replacement)
    const fs_sync = require('fs');
    fs_sync.writeFileSync(scriptPath, content, 'utf8');

    scriptCounter++;
    return `<script src="/scripts/${scriptFile}"><\/script>`;
  });

  if (scriptCounter > 0) {
    await fs.writeFile(indexPath, updatedHtml);
  }
}


async function copyExtensionFiles() {
  if (!(await fileExists(EXTENSION_DIR))) {
    throw new Error(`Extension folder not found at ${EXTENSION_DIR}.`);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await ensureIcons();

  const entries = await fs.readdir(EXTENSION_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const src = path.join(EXTENSION_DIR, entry.name);
    const dest = path.join(OUT_DIR, entry.name);
    await fs.copyFile(src, dest);
  }

  const outIconsDir = path.join(OUT_DIR, 'icons');
  await fs.mkdir(outIconsDir, { recursive: true });

  for (const size of ICON_SIZES) {
    const src = path.join(ICONS_DIR, `icon${size}.png`);
    const dest = path.join(outIconsDir, `icon${size}.png`);
    await fs.copyFile(src, dest);
  }

  await renameNextAssets();
  await rewriteNextReferences();
  await extractInlineScripts();
}

copyExtensionFiles().catch((error) => {
  console.error('Extension asset copy failed.');
  console.error(error);
  process.exitCode = 1;
});
