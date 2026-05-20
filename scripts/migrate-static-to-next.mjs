import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const legacyDir = path.join(rootDir, 'legacy-static');

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const slugToPascal = (slug) =>
  slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const normalizeExternalScript = (src) => {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) {
    return src;
  }

  return `/${src.replace(/^\.?\//, '').replace(/^\.\.\//, '')}`;
};

const stripScripts = (markup, collectedScripts, collectedExternalScripts) =>
  markup.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_match, attrs, content) => {
    const srcMatch = attrs.match(/\ssrc=(["'])(.*?)\1/i);
    if (srcMatch) {
      collectedExternalScripts.push(normalizeExternalScript(srcMatch[2]));
    } else if (content.trim()) {
      collectedScripts.push(content);
    }

    return '';
  });

const getTagContent = (html, tagName) => {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1] : '';
};

const getTitle = (headMarkup, fallback) => {
  const titleMatch = headMarkup.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : fallback;
};

const cleanHeadMarkup = (headMarkup) =>
  headMarkup
    .replace(/<meta\b[^>]*>\s*/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, '')
    .trim();

const extractDocument = (filePath, fallbackTitle) => {
  const html = readFile(filePath);
  const rawHead = getTagContent(html, 'head');
  const rawBody = getTagContent(html, 'body');
  const scripts = [];
  const externalScripts = [];
  const headMarkup = cleanHeadMarkup(stripScripts(rawHead, scripts, externalScripts));
  const bodyMarkup = stripScripts(rawBody, scripts, externalScripts).trim();

  return {
    title: getTitle(rawHead, fallbackTitle),
    headMarkup,
    bodyMarkup,
    scripts,
    externalScripts,
  };
};

const writeComponent = ({ sourceFile, outputDir, slug, importPath, documentClassName, bodyClassName }) => {
  const componentName = slugToPascal(slug);
  const doc = extractDocument(sourceFile, componentName);
  const componentPath = path.join(outputDir, `${componentName}.jsx`);
  const componentSource = `import LegacyHtmlPage from '${importPath}';\n\nconst page = ${JSON.stringify(
    {
      documentClassName,
      bodyClassName,
      ...doc,
    },
    null,
    2,
  )};\n\nexport const title = page.title;\n\nexport default function ${componentName}() {\n  return <LegacyHtmlPage {...page} />;\n}\n`;

  fs.writeFileSync(componentPath, componentSource);
  return { componentName, title: doc.title };
};

const writeRoute = ({ routeDir, componentImport, componentName, title }) => {
  ensureDir(routeDir);
  const pagePath = path.join(routeDir, 'page.jsx');
  const pageSource = `import ${componentName}, { title } from '${componentImport}';\n\nexport const metadata = {\n  title,\n};\n\nexport default function Page() {\n  return <${componentName} />;\n}\n`;
  fs.writeFileSync(pagePath, pageSource);
};

const writeHome = () => {
  const sourceFile = path.join(legacyDir, 'index.html');
  const outputDir = path.join(rootDir, 'components', 'home');
  ensureDir(outputDir);

  const doc = extractDocument(sourceFile, 'Prism Dev Browser');
  const page = {
    documentClassName: 'legacy-home-document',
    bodyClassName: 'legacy-home-route',
    title: doc.title,
    headMarkup: '',
    bodyMarkup: doc.bodyMarkup,
    scripts: [],
    externalScripts: ['/script.js', '/matrix.js'],
  };

  fs.writeFileSync(
    path.join(outputDir, 'HomePage.jsx'),
    `import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';\n\nconst page = ${JSON.stringify(
      page,
      null,
      2,
    )};\n\nexport default function HomePage() {\n  return <LegacyHtmlPage {...page} />;\n}\n`,
  );

  fs.writeFileSync(
    path.join(rootDir, 'app', 'page.jsx'),
    `import HomePage from '@/components/home/HomePage';\n\nexport default function Page() {\n  return <HomePage />;\n}\n`,
  );
};

const writeCollection = ({ sourceDirName, appDirName, componentDirName, documentClassName, bodyClassName }) => {
  const sourceDir = path.join(legacyDir, sourceDirName);
  const componentDir = path.join(rootDir, 'components', componentDirName);
  ensureDir(componentDir);

  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith('.html'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const slug = file.replace(/\.html$/, '');
    const { componentName, title } = writeComponent({
      sourceFile: path.join(sourceDir, file),
      outputDir: componentDir,
      slug,
      importPath: '@/components/legacy/LegacyHtmlPage',
      documentClassName,
      bodyClassName,
    });

    writeRoute({
      routeDir: path.join(rootDir, 'app', appDirName, slug),
      componentImport: `@/components/${componentDirName}/${componentName}`,
      componentName,
      title,
    });
  }
};

const writeStandalone = ({ sourceFileName, appRouteName, componentDirName, componentName, documentClassName, bodyClassName }) => {
  const componentDir = path.join(rootDir, 'components', componentDirName);
  ensureDir(componentDir);

  const doc = extractDocument(path.join(legacyDir, sourceFileName), componentName);
  const componentPath = path.join(componentDir, `${componentName}.jsx`);
  const page = {
    documentClassName,
    bodyClassName,
    ...doc,
  };

  fs.writeFileSync(
    componentPath,
    `import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';\n\nconst page = ${JSON.stringify(
      page,
      null,
      2,
    )};\n\nexport const title = page.title;\n\nexport default function ${componentName}() {\n  return <LegacyHtmlPage {...page} />;\n}\n`,
  );

  writeRoute({
    routeDir: path.join(rootDir, 'app', appRouteName),
    componentImport: `@/components/${componentDirName}/${componentName}`,
    componentName,
    title: doc.title,
  });
};

writeHome();
writeStandalone({
  sourceFileName: 'config-loader.html',
  appRouteName: 'config-loader',
  componentDirName: 'config',
  componentName: 'ConfigLoader',
  documentClassName: 'legacy-tool-document',
  bodyClassName: 'legacy-tool-route',
});
writeCollection({
  sourceDirName: 'dev-space',
  appDirName: 'dev-space',
  componentDirName: 'dev-tools',
  documentClassName: 'legacy-tool-document',
  bodyClassName: 'legacy-tool-route',
});
writeCollection({
  sourceDirName: 'clock-previews',
  appDirName: 'clock-previews',
  componentDirName: 'clock-previews',
  documentClassName: 'legacy-clock-preview-document',
  bodyClassName: 'legacy-clock-preview-route',
});

fs.copyFileSync(path.join(legacyDir, 'script.js'), path.join(rootDir, 'public', 'script.js'));
fs.copyFileSync(path.join(legacyDir, 'matrix.js'), path.join(rootDir, 'public', 'matrix.js'));
