import { browser } from 'wxt/browser';
import type {
  AssistantAiResponse,
  AssistantChatMessage,
  AssistantQuickAction,
  AssistantSaveResponse,
  AssistantUiState
} from '@/src/assistant/types';

const HOST_ID = 'prism-space-assistant-host';
const UI_STATE_KEY = 'prism.assistant.ui.v1';
const MAX_CONTENT_CHARS = 18000;
const DEFAULT_BUTTON_TOP = 220;

const QUICK_ACTIONS: Array<{ action: AssistantQuickAction; label: string; query: string }> = [
  {
    action: 'summarize',
    label: 'Summarize Page',
    query: 'Summarize this page with TL;DR, key insights, and action items.'
  },
  {
    action: 'save',
    label: 'Save to Space',
    query: 'Create a concise summary and useful notes for saving this page.'
  },
  {
    action: 'notes',
    label: 'Generate Notes',
    query: 'Create structured study notes from this page.'
  },
  {
    action: 'explain-selection',
    label: 'Explain Selection',
    query: 'Explain the selected text in simple terms.'
  },
  {
    action: 'interview',
    label: 'Interview Questions',
    query: 'Generate interview questions based on this page content.'
  }
];

function createId() {
  return globalThis.crypto?.randomUUID?.() || `prism-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSupportedPage() {
  if (window.top !== window) {
    return false;
  }

  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSelectedText() {
  return window.getSelection()?.toString().trim() || '';
}

function isElementVisible(element: Element) {
  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.getAttribute('aria-hidden') === 'true'
  ) {
    return false;
  }

  return element.getClientRects().length > 0;
}

function isNoiseElement(element: Element) {
  return !!element.closest(
    [
      'nav',
      'header',
      'footer',
      'aside',
      'form',
      'script',
      'style',
      'noscript',
      'svg',
      'canvas',
      'iframe',
      'button',
      'input',
      'select',
      'textarea',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[aria-hidden="true"]',
      '[hidden]'
    ].join(',')
  );
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function blockPrefix(element: Element) {
  const tagName = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tagName)) {
    return `${'#'.repeat(Number(tagName.slice(1)))} `;
  }

  if (tagName === 'li') {
    return '- ';
  }

  if (tagName === 'blockquote') {
    return '> ';
  }

  return '';
}

function appendIntelligently(blocks: string[]) {
  let output = '';

  for (const block of blocks) {
    const next = output ? `${output}\n\n${block}` : block;
    if (next.length <= MAX_CONTENT_CHARS) {
      output = next;
      continue;
    }

    const remaining = MAX_CONTENT_CHARS - output.length - 48;
    if (remaining > 240) {
      const fragment = block.slice(0, remaining);
      const sentenceEnd = Math.max(fragment.lastIndexOf('. '), fragment.lastIndexOf('? '), fragment.lastIndexOf('! '));
      output += `\n\n${fragment.slice(0, sentenceEnd > 120 ? sentenceEnd + 1 : remaining).trim()}`;
    }

    output += '\n\n[Content truncated to fit the assistant context window.]';
    break;
  }

  return output.trim();
}

function extractPageContent() {
  const selectors = [
    'main h1',
    'main h2',
    'main h3',
    'main h4',
    'main p',
    'main li',
    'main blockquote',
    'main pre',
    'article h1',
    'article h2',
    'article h3',
    'article h4',
    'article p',
    'article li',
    'article blockquote',
    'article pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'li',
    'blockquote',
    'pre'
  ];

  const blocks: string[] = [];
  const seen = new Set<string>();

  for (const element of Array.from(document.querySelectorAll(selectors.join(',')))) {
    if (isNoiseElement(element) || !isElementVisible(element)) {
      continue;
    }

    const text = normalizeText(element.textContent || '');
    if (text.length < 3 || seen.has(text)) {
      continue;
    }

    seen.add(text);
    blocks.push(`${blockPrefix(element)}${text}`);
  }

  if (blocks.length === 0) {
    const bodyText = normalizeText(document.body?.innerText || '');
    return bodyText.slice(0, MAX_CONTENT_CHARS);
  }

  return appendIntelligently(blocks);
}

async function loadState(): Promise<AssistantUiState> {
  try {
    const result = await browser.storage.local.get(UI_STATE_KEY);
    const stored = result[UI_STATE_KEY] as Partial<AssistantUiState> | undefined;
    return {
      open: !!stored?.open,
      buttonTop: typeof stored?.buttonTop === 'number' ? stored.buttonTop : DEFAULT_BUTTON_TOP,
      messages: Array.isArray(stored?.messages) ? stored.messages.slice(-20) : []
    };
  } catch {
    return { open: false, buttonTop: DEFAULT_BUTTON_TOP, messages: [] };
  }
}

async function saveState(state: AssistantUiState) {
  await browser.storage.local.set({
    [UI_STATE_KEY]: {
      ...state,
      messages: state.messages.slice(-20)
    }
  });
}

function createStyles() {
  const style = document.createElement('style');
  style.textContent = `
    :host {
      --prism-p: #2D5016;
      --prism-p-bright: #4F8A2A;
      --prism-a: #8FAF00;
      --prism-bg: #F8F9F4;
      --prism-surface: #FFFFFF;
      --prism-surface-2: #F1F4EC;
      --prism-ink: #141A0E;
      --prism-ink-2: #3A4830;
      --prism-ink-3: #7A8F6A;
      --prism-border: #D8E2C8;
      --prism-error: #C0392B;
      --prism-shadow: 0 18px 60px rgba(20, 26, 14, .2);
      --prism-ease-spatial: cubic-bezier(0.38, 1.21, 0.22, 1);
      --prism-ease-effects: cubic-bezier(0.31, 0.94, 0.34, 1);
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --prism-p: #8DC85A;
        --prism-p-bright: #B4EA84;
        --prism-a: #C8E040;
        --prism-bg: #0C1208;
        --prism-surface: #141C0E;
        --prism-surface-2: #1C2816;
        --prism-ink: #DDEEC8;
        --prism-ink-2: #A8C890;
        --prism-ink-3: #608040;
        --prism-border: #2A3C1E;
        --prism-error: #FF6B6B;
        --prism-shadow: 0 18px 70px rgba(0, 0, 0, .48);
      }
    }

    * {
      box-sizing: border-box;
    }

    button,
    textarea {
      font: inherit;
    }

    .prism-button {
      position: fixed;
      right: 18px;
      top: var(--button-top);
      z-index: 2147483646;
      width: 52px;
      height: 52px;
      border: 1px solid color-mix(in srgb, var(--prism-p-bright), transparent 35%);
      border-radius: 999px;
      background: linear-gradient(135deg, var(--prism-p), var(--prism-a));
      color: var(--prism-surface);
      box-shadow: var(--prism-shadow);
      cursor: grab;
      display: grid;
      place-items: center;
      transition: transform 350ms var(--prism-ease-spatial), box-shadow 150ms var(--prism-ease-effects);
      user-select: none;
      touch-action: none;
    }

    .prism-button:focus-visible,
    .prism-close:focus-visible,
    .prism-clear:focus-visible,
    .prism-send:focus-visible,
    .prism-action:focus-visible,
    .prism-selection-action:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--prism-a), transparent 35%);
      outline-offset: 2px;
    }

    .prism-button:hover {
      transform: translateY(-2px) scale(1.02);
    }

    .prism-button:active {
      cursor: grabbing;
      transform: scale(.98);
    }

    .prism-mark {
      width: 30px;
      height: 30px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--prism-surface), transparent 82%);
      color: var(--prism-surface);
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .prism-panel {
      position: fixed;
      top: 14px;
      right: 14px;
      bottom: 14px;
      z-index: 2147483645;
      width: min(420px, calc(100vw - 28px));
      background: color-mix(in srgb, var(--prism-surface), transparent 2%);
      color: var(--prism-ink);
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      box-shadow: var(--prism-shadow);
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      overflow: hidden;
      opacity: 0;
      transform: translateX(calc(100% + 24px));
      pointer-events: none;
      transition: transform 500ms var(--prism-ease-spatial), opacity 200ms var(--prism-ease-effects);
    }

    .prism-panel[data-open="true"] {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .prism-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 14px 12px;
      border-bottom: 1px solid var(--prism-border);
      background: color-mix(in srgb, var(--prism-surface), var(--prism-surface-2) 40%);
    }

    .prism-title {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .prism-title strong {
      color: var(--prism-ink);
      font-size: 14px;
      line-height: 1.2;
    }

    .prism-title span {
      color: var(--prism-ink-3);
      font-size: 11px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 290px;
    }

    .prism-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .prism-close,
    .prism-clear {
      width: 34px;
      height: 34px;
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      background: var(--prism-surface);
      color: var(--prism-ink-2);
      cursor: pointer;
      transition: background 150ms var(--prism-ease-effects), transform 350ms var(--prism-ease-spatial);
    }

    .prism-clear {
      width: auto;
      min-width: 58px;
      padding: 0 10px;
      font-size: 12px;
      font-weight: 700;
    }

    .prism-close:hover,
    .prism-clear:hover {
      background: var(--prism-surface-2);
      transform: rotate(2deg);
    }

    .prism-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--prism-border);
      background: var(--prism-surface);
    }

    .prism-action {
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      background: var(--prism-surface-2);
      color: var(--prism-ink-2);
      min-height: 36px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 650;
      transition: border-color 150ms var(--prism-ease-effects), transform 350ms var(--prism-ease-spatial), background 150ms var(--prism-ease-effects);
    }

    .prism-action:hover {
      border-color: color-mix(in srgb, var(--prism-p-bright), transparent 25%);
      background: color-mix(in srgb, var(--prism-p-bright), var(--prism-surface) 88%);
      transform: translateY(-1px);
    }

    .prism-messages {
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--prism-bg);
    }

    .prism-empty {
      margin: auto;
      color: var(--prism-ink-3);
      text-align: center;
      max-width: 280px;
      line-height: 1.5;
      font-size: 13px;
    }

    .prism-message {
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      padding: 10px 11px;
      background: var(--prism-surface);
      color: var(--prism-ink);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.5;
      font-size: 13px;
    }

    .prism-message[data-role="user"] {
      align-self: flex-end;
      max-width: 88%;
      background: color-mix(in srgb, var(--prism-p-bright), var(--prism-surface) 84%);
    }

    .prism-message[data-role="assistant"] {
      align-self: flex-start;
      max-width: 94%;
    }

    .prism-message[data-status="error"] {
      border-color: color-mix(in srgb, var(--prism-error), transparent 25%);
      color: var(--prism-error);
    }

    .prism-role {
      display: block;
      margin-bottom: 5px;
      color: var(--prism-ink-3);
      font-size: 10px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .prism-loading {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    .prism-loading span {
      width: 5px;
      height: 5px;
      border-radius: 999px;
      background: var(--prism-p-bright);
      animation: prism-pulse 900ms var(--prism-ease-effects) infinite;
    }

    .prism-loading span:nth-child(2) {
      animation-delay: 120ms;
    }

    .prism-loading span:nth-child(3) {
      animation-delay: 240ms;
    }

    .prism-composer {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--prism-border);
      background: var(--prism-surface);
    }

    .prism-input {
      min-height: 44px;
      max-height: 130px;
      resize: vertical;
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      padding: 10px 11px;
      background: var(--prism-surface-2);
      color: var(--prism-ink);
      outline: none;
      line-height: 1.4;
      font-size: 13px;
    }

    .prism-input:focus {
      border-color: color-mix(in srgb, var(--prism-p-bright), transparent 20%);
    }

    .prism-send {
      min-width: 62px;
      border: 1px solid color-mix(in srgb, var(--prism-p-bright), transparent 30%);
      border-radius: 8px;
      background: var(--prism-p);
      color: var(--prism-surface);
      cursor: pointer;
      font-weight: 750;
      transition: opacity 150ms var(--prism-ease-effects), transform 350ms var(--prism-ease-spatial);
    }

    .prism-send:hover {
      transform: translateY(-1px);
    }

    .prism-send:disabled {
      cursor: not-allowed;
      opacity: .55;
      transform: none;
    }

    .prism-selection-menu {
      position: fixed;
      z-index: 2147483647;
      display: none;
      gap: 6px;
      padding: 6px;
      border: 1px solid var(--prism-border);
      border-radius: 8px;
      background: var(--prism-surface);
      box-shadow: var(--prism-shadow);
    }

    .prism-selection-menu[data-visible="true"] {
      display: flex;
    }

    .prism-selection-action {
      border: 1px solid var(--prism-border);
      border-radius: 7px;
      background: var(--prism-surface-2);
      color: var(--prism-ink-2);
      cursor: pointer;
      padding: 7px 9px;
      font-size: 12px;
      font-weight: 700;
    }

    .prism-selection-action:hover {
      border-color: color-mix(in srgb, var(--prism-p-bright), transparent 25%);
    }

    @keyframes prism-pulse {
      0%, 100% { transform: scale(1); opacity: .45; }
      50% { transform: scale(1.35); opacity: 1; }
    }

    @media (max-width: 520px) {
      .prism-button {
        right: 12px;
        width: 48px;
        height: 48px;
      }

      .prism-panel {
        inset: 8px;
        width: auto;
      }

      .prism-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;
  return style;
}

function createMessageElement(message: AssistantChatMessage) {
  const article = document.createElement('article');
  article.className = 'prism-message';
  article.dataset.role = message.role;
  if (message.status) {
    article.dataset.status = message.status;
  }

  const role = document.createElement('span');
  role.className = 'prism-role';
  role.textContent = message.role === 'user' ? 'You' : 'Prism';
  article.append(role);

  if (message.status === 'loading') {
    const loader = document.createElement('span');
    loader.className = 'prism-loading';
    loader.setAttribute('aria-label', 'Prism is thinking');
    loader.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));
    article.append(loader);
  } else {
    const content = document.createElement('div');
    if (message.role === 'assistant' && message.status !== 'error') {
      content.innerHTML = renderMarkdown(message.content);
    } else {
      content.textContent = message.content;
    }
    article.append(content);
  }

  return article;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(text: string) {
  const codeSegments: string[] = [];
  const tokenizedText = text.replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `@@CODE${codeSegments.length}@@`;
    codeSegments.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  let html = escapeHtml(tokenizedText);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label: string, url: string) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  codeSegments.forEach((codeHtml, index) => {
    html = html.replaceAll(`@@CODE${index}@@`, codeHtml);
  });
  return html;
}

function renderMarkdown(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }
    blocks.push(`<p>${paragraphLines.map(renderInlineMarkdown).join('<br>')}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0 || !listType) {
      return;
    }
    const tagName = listType;
    blocks.push(`<${tagName}>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</${tagName}>`);
    listItems = [];
    listType = null;
  };

  const flushCodeBlock = () => {
    blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = [];
    inCodeBlock = false;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const headingLevel = headingMatch[1].length;
      blocks.push(`<h${headingLevel}>${renderInlineMarkdown(headingMatch[2])}</h${headingLevel}>`);
      continue;
    }
    const quoteMatch = trimmedLine.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote>${renderInlineMarkdown(quoteMatch[1])}</blockquote>`);
      continue;
    }
    const unorderedMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType && listType !== 'ul') {
        flushList();
      }
      listType = 'ul';
      listItems.push(unorderedMatch[1]);
      continue;
    }
    const orderedMatch = trimmedLine.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== 'ol') {
        flushList();
      }
      listType = 'ol';
      listItems.push(orderedMatch[1]);
      continue;
    }
    flushList();
    paragraphLines.push(trimmedLine);
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }
  flushParagraph();
  flushList();
  return blocks.length > 0 ? blocks.join('') : renderInlineMarkdown(text).replace(/\n/g, '<br>');
}

function parseSavedContent(content: string) {
  const summaryMatch = content.match(/summary\s*:?\s*([\s\S]*?)(?:\n\s*notes\s*:|$)/i);
  const notesMatch = content.match(/notes\s*:?\s*([\s\S]*)/i);

  return {
    summary: (summaryMatch?.[1] || content).trim(),
    notes: (notesMatch?.[1] || content).trim()
  };
}

export async function mountPrismAssistant() {
  if (!isSupportedPage() || document.getElementById(HOST_ID)) {
    return;
  }

  const state = await loadState();
  state.buttonTop = clamp(state.buttonTop, 76, window.innerHeight - 76);

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.documentElement.append(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.append(createStyles());

  const button = document.createElement('button');
  button.className = 'prism-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Open Prism assistant');
  button.style.setProperty('--button-top', `${state.buttonTop}px`);

  const mark = document.createElement('span');
  mark.className = 'prism-mark';
  mark.textContent = 'P';
  button.append(mark);

  const panel = document.createElement('section');
  panel.className = 'prism-panel';
  panel.dataset.open = String(state.open);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Prism page assistant');
  panel.setAttribute('aria-modal', 'false');

  const header = document.createElement('header');
  header.className = 'prism-header';

  const title = document.createElement('div');
  title.className = 'prism-title';
  const titleStrong = document.createElement('strong');
  titleStrong.textContent = 'Prism Assistant';
  const titleSpan = document.createElement('span');
  titleSpan.textContent = document.title || window.location.hostname;
  title.append(titleStrong, titleSpan);

  const closeButton = document.createElement('button');
  closeButton.className = 'prism-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close Prism assistant');
  closeButton.textContent = 'x';

  const clearButton = document.createElement('button');
  clearButton.className = 'prism-clear';
  clearButton.type = 'button';
  clearButton.setAttribute('aria-label', 'Clear Prism assistant chat');
  clearButton.textContent = 'Clear';

  const headerActions = document.createElement('div');
  headerActions.className = 'prism-header-actions';
  headerActions.append(clearButton, closeButton);

  header.append(title, headerActions);

  const actions = document.createElement('div');
  actions.className = 'prism-actions';
  for (const quickAction of QUICK_ACTIONS) {
    const actionButton = document.createElement('button');
    actionButton.className = 'prism-action';
    actionButton.type = 'button';
    actionButton.textContent = quickAction.label;
    actionButton.addEventListener('click', () => {
      void runQuickAction(quickAction.action, quickAction.query);
    });
    actions.append(actionButton);
  }

  const messages = document.createElement('div');
  messages.className = 'prism-messages';
  messages.setAttribute('aria-live', 'polite');

  const composer = document.createElement('form');
  composer.className = 'prism-composer';

  const input = document.createElement('textarea');
  input.className = 'prism-input';
  input.name = 'query';
  input.rows = 2;
  input.placeholder = 'Ask about this page...';
  input.setAttribute('aria-label', 'Ask Prism about the current page');

  const sendButton = document.createElement('button');
  sendButton.className = 'prism-send';
  sendButton.type = 'submit';
  sendButton.textContent = 'Ask';
  composer.append(input, sendButton);

  panel.append(header, actions, messages, composer);

  const selectionMenu = document.createElement('div');
  selectionMenu.className = 'prism-selection-menu';
  selectionMenu.setAttribute('role', 'menu');
  for (const item of [
    { label: 'Explain', action: 'explain-selection' as AssistantQuickAction, query: 'Explain this selected text.' },
    { label: 'Summarize', action: 'summarize' as AssistantQuickAction, query: 'Summarize this selected text.' },
    { label: 'Save', action: 'save' as AssistantQuickAction, query: 'Save this selected text with useful notes.' }
  ]) {
    const selectionButton = document.createElement('button');
    selectionButton.className = 'prism-selection-action';
    selectionButton.type = 'button';
    selectionButton.textContent = item.label;
    selectionButton.addEventListener('click', () => {
      selectionMenu.dataset.visible = 'false';
      void runQuickAction(item.action, item.query);
    });
    selectionMenu.append(selectionButton);
  }

  shadow.append(button, panel, selectionMenu);

  function persistState() {
    void saveState(state).catch(() => undefined);
  }

  function setOpen(open: boolean) {
    state.open = open;
    panel.dataset.open = String(open);
    button.setAttribute('aria-label', open ? 'Close Prism assistant' : 'Open Prism assistant');
    persistState();

    if (open) {
      window.setTimeout(() => input.focus(), 120);
    }
  }

  function renderMessages() {
    messages.replaceChildren();

    if (state.messages.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'prism-empty';
      empty.textContent = 'Ask Prism to summarize, explain, create notes, or extract action items from this page.';
      messages.append(empty);
      return;
    }

    for (const message of state.messages) {
      messages.append(createMessageElement(message));
    }
    messages.scrollTop = messages.scrollHeight;
  }

  function updateMessage(id: string, patch: Partial<AssistantChatMessage>) {
    const message = state.messages.find((item) => item.id === id);
    if (message) {
      Object.assign(message, patch);
      renderMessages();
      persistState();
    }
  }

  function addMessage(message: Omit<AssistantChatMessage, 'id' | 'createdAt'>) {
    const nextMessage: AssistantChatMessage = {
      id: createId(),
      createdAt: Date.now(),
      ...message
    };
    state.messages.push(nextMessage);
    state.messages = state.messages.slice(-20);
    renderMessages();
    persistState();
    return nextMessage;
  }

  async function sendAiRequest(userQuery: string, action: AssistantQuickAction | 'chat') {
    const selectedText = getSelectedText();
    const payload = {
      pageTitle: document.title || '',
      pageUrl: window.location.href,
      extractedPageContent: extractPageContent(),
      selectedText,
      userQuery,
      action
    };

    return browser.runtime.sendMessage({
      type: 'PRISM_AI_ASSISTANT_CHAT',
      payload
    }) as Promise<AssistantAiResponse>;
  }

  async function saveToSpace(content: string) {
    const parsed = parseSavedContent(content);
    const response = (await browser.runtime.sendMessage({
      type: 'PRISM_SPACE_SAVE',
      payload: {
        url: window.location.href,
        title: document.title || window.location.href,
        summary: parsed.summary,
        notes: parsed.notes,
        timestamp: Date.now()
      }
    })) as AssistantSaveResponse;

    if (!response.ok) {
      throw new Error(response.error || 'Unable to save page');
    }
  }

  async function runAssistant(userQuery: string, action: AssistantQuickAction | 'chat' = 'chat') {
    const query = userQuery.trim();
    if (!query) {
      return;
    }

    setOpen(true);
    sendButton.disabled = true;

    addMessage({ role: 'user', content: query, status: 'done' });
    const loadingMessage = addMessage({ role: 'assistant', content: '', status: 'loading' });

    try {
      const response = await sendAiRequest(query, action);
      if (!response.ok || !response.content) {
        throw new Error(response.error || 'Prism could not answer that request');
      }

      if (action === 'save') {
        await saveToSpace(response.content);
        updateMessage(loadingMessage.id, {
          content: `Saved to Space.\n\n${response.content}`,
          status: 'done'
        });
      } else {
        updateMessage(loadingMessage.id, { content: response.content, status: 'done' });
      }
    } catch (error) {
      updateMessage(loadingMessage.id, {
        content: `${error instanceof Error ? error.message : 'Something went wrong'}\n\nTry again in a moment.`,
        status: 'error'
      });
    } finally {
      sendButton.disabled = false;
    }
  }

  async function runQuickAction(action: AssistantQuickAction, query: string) {
    if (action === 'explain-selection' && !getSelectedText()) {
      setOpen(true);
      addMessage({
        role: 'assistant',
        content: 'Select text on the page first, then choose Explain Selection.',
        status: 'done'
      });
      return;
    }

    await runAssistant(query, action);
  }

  function updateSelectionMenu() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (!selection || selectedText.length < 2 || selection.rangeCount === 0) {
      selectionMenu.dataset.visible = 'false';
      return;
    }

    const activeElement = shadow.activeElement;
    if (activeElement) {
      selectionMenu.dataset.visible = 'false';
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) {
      selectionMenu.dataset.visible = 'false';
      return;
    }

    selectionMenu.style.left = `${clamp(rect.left + rect.width / 2 - 92, 8, window.innerWidth - 188)}px`;
    selectionMenu.style.top = `${clamp(rect.top - 48, 8, window.innerHeight - 48)}px`;
    selectionMenu.dataset.visible = 'true';
  }

  let selectionTimer: number | undefined;
  document.addEventListener('selectionchange', () => {
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(updateSelectionMenu, 120);
  });

  closeButton.addEventListener('click', () => setOpen(false));

  clearButton.addEventListener('click', () => {
    state.messages = [];
    renderMessages();
    persistState();
    input.focus();
  });

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    input.value = '';
    void runAssistant(query);
  });

  input.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyP') {
      event.preventDefault();
      setOpen(!state.open);
    }

    if (event.key === 'Escape' && state.open) {
      setOpen(false);
    }
  });

  let dragStartY = 0;
  let dragStartTop = state.buttonTop;
  let pointerDown = false;
  let dragged = false;

  button.addEventListener('pointerdown', (event) => {
    pointerDown = true;
    dragged = false;
    dragStartY = event.clientY;
    dragStartTop = state.buttonTop;
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener('pointermove', (event) => {
    if (!pointerDown) {
      return;
    }

    const delta = event.clientY - dragStartY;
    if (Math.abs(delta) > 4) {
      dragged = true;
    }

    state.buttonTop = clamp(dragStartTop + delta, 76, window.innerHeight - 76);
    button.style.setProperty('--button-top', `${state.buttonTop}px`);
  });

  button.addEventListener('pointerup', (event) => {
    pointerDown = false;
    button.releasePointerCapture(event.pointerId);
    persistState();

    if (!dragged) {
      setOpen(!state.open);
    }
  });

  window.addEventListener('resize', () => {
    state.buttonTop = clamp(state.buttonTop, 76, window.innerHeight - 76);
    button.style.setProperty('--button-top', `${state.buttonTop}px`);
    persistState();
  });

  renderMessages();
}
