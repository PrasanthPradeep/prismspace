/**
 * Builds the structured user prompt sent to the AI provider.
 * The extension sends raw page context; the backend wraps it in a
 * well-formed prompt so no prompt logic lives client-side.
 */

export interface PageContext {
  pageTitle?: string;
  pageUrl?: string;
  extractedPageContent?: string;
  selectedText?: string;
  userQuery?: string;
}

/**
 * Builds the user message for page-assistant actions.
 * All fields are optional — the provider will use whatever is available.
 */
export function buildPageAssistantUserPrompt(context: PageContext): string {
  return JSON.stringify(
    {
      pageTitle: context.pageTitle || '',
      pageUrl: context.pageUrl || '',
      extractedPageContent: context.extractedPageContent || '',
      selectedText: context.selectedText || '',
      userQuery: context.userQuery || ''
    },
    null,
    2
  );
}

/**
 * Builds the user message for Dev Space tool actions.
 * These tools send a single text input rather than page context.
 */
export function buildDevToolUserPrompt(input: string): string {
  return input.trim();
}
