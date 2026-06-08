import type { PageAssistantRequest } from '../validation/schemas.js';

const MAX_SENTENCES = 8;

const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'before',
  'being',
  'between',
  'built',
  'could',
  'every',
  'from',
  'have',
  'helps',
  'into',
  'more',
  'page',
  'that',
  'their',
  'there',
  'this',
  'through',
  'with',
  'without',
  'your'
]);

function cleanText(value: string): string {
  return value
    .replace(/\[Content truncated to fit the assistant context window\.\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSourceText(request: PageAssistantRequest): string {
  if (request.action === 'explain-selection' && request.selectedText) {
    return cleanText(request.selectedText);
  }

  return cleanText(request.extractedPageContent || request.selectedText || request.userQuery || '');
}

function splitSentences(text: string): string[] {
  const seen = new Set<string>();
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 24 && part.length <= 320)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (sentences.length > 0) {
    return sentences.slice(0, MAX_SENTENCES);
  }

  return text ? [text.slice(0, 320)] : [];
}

function keywords(text: string): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];

  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([word]) => word);
}

function bullets(items: string[], fallback: string): string {
  const selected = items.length > 0 ? items : [fallback];
  return selected.map((item) => `- ${item}`).join('\n');
}

function notice(reason?: string): string {
  return [
    'AI provider unavailable. Prism used a local page-text fallback instead.',
    reason ? `Reason: ${reason}` : ''
  ].filter(Boolean).join('\n');
}

export function buildPageAssistantFallback(request: PageAssistantRequest, reason?: string): string {
  const sourceText = getSourceText(request);
  const sentences = splitSentences(sourceText);
  const terms = keywords(sourceText);
  const title = request.pageTitle ? ` for "${request.pageTitle}"` : '';

  if (!sourceText) {
    return `${notice(reason)}\n\nI could not find enough readable page text to build a local response.`;
  }

  switch (request.action) {
    case 'notes':
      return `${notice(reason)}

Structured Notes${title}

Main Points
${bullets(sentences.slice(0, 6), 'No clear main points were found in the captured page text.')}

Key Terms
${bullets(terms, 'No repeated key terms were found.')}`;

    case 'save':
      return `${notice(reason)}

Summary:
${sentences[0] || sourceText.slice(0, 240)}

Notes:
${bullets(sentences.slice(1, 6), 'No additional notes were found in the captured page text.')}`;

    case 'explain-selection':
      return `${notice(reason)}

Simple Explanation
${sentences[0] || sourceText.slice(0, 240)}

Important Details
${bullets(sentences.slice(1, 5), 'No additional selected-text details were found.')}`;

    case 'interview':
      return `${notice(reason)}

Interview Questions${title}

${bullets(
        [
          ...terms.slice(0, 5).map((term) => `How would you explain the role of ${term} in this page?`),
          'What is the main problem or promise described by this page?',
          'Which detail from the page would you verify before making a decision?'
        ].slice(0, 7),
        'What is the main idea of this page?'
      )}`;

    case 'chat':
      return `${notice(reason)}

Best Available Answer${title}

${sentences[0] || sourceText.slice(0, 240)}

Relevant Page Details
${bullets(sentences.slice(1, 6), 'No additional page details were found.')}`;

    case 'summarize':
    default:
      return `${notice(reason)}

TL;DR${title}
${sentences[0] || sourceText.slice(0, 240)}

Key Insights
${bullets(sentences.slice(1, 6), 'No additional insights were found in the captured page text.')}

Action Items
- Review the page details above.
- Retry the AI request after backend quota or billing is restored.`;
  }
}
