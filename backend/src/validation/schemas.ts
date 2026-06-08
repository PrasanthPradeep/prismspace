import { z } from 'zod';

// ─── Shared constraints ──────────────────────────────────────────────────────

const MAX_CONTENT_CHARS = 24_000;
const MAX_QUERY_CHARS = 2_000;
const MAX_TEXT_CHARS = 50_000;

// ─── Page Assistant schemas ──────────────────────────────────────────────────

const pageAssistantActions = [
  'chat',
  'summarize',
  'notes',
  'explain-selection',
  'save',
  'interview'
] as const;

export type PageAssistantAction = (typeof pageAssistantActions)[number];

export const PageAssistantRequestSchema = z.object({
  action: z.enum(pageAssistantActions).optional().default('chat'),

  pageTitle: z.string().max(512).optional().default(''),
  pageUrl: z.string().max(2048).optional().default(''),

  extractedPageContent: z
    .string()
    .max(MAX_CONTENT_CHARS, `Page content must not exceed ${MAX_CONTENT_CHARS} characters`)
    .optional()
    .default(''),

  selectedText: z
    .string()
    .max(MAX_QUERY_CHARS, `Selected text must not exceed ${MAX_QUERY_CHARS} characters`)
    .optional()
    .default(''),

  userQuery: z
    .string()
    .max(MAX_QUERY_CHARS, `User query must not exceed ${MAX_QUERY_CHARS} characters`)
    .optional()
    .default(''),

  userId: z.string().max(128).optional()
});

export const SavePageRequestSchema = z.object({
  userId: z.string().min(1).max(128),
  url: z.string().max(2048),
  title: z.string().max(512),
  summary: z.string().max(100000),
  notes: z.string().max(100000).optional().default('')
});

export type SavePageRequest = z.infer<typeof SavePageRequestSchema>;

export type PageAssistantRequest = z.infer<typeof PageAssistantRequestSchema>;

// ─── Dev Tool schema ─────────────────────────────────────────────────────────

export const DevToolRequestSchema = z.object({
  /** The prompt key to look up in systemPrompts.ts */
  promptKey: z.string().min(1).max(64),

  /** The user's input text for the tool */
  input: z
    .string()
    .min(1, 'Input text is required')
    .max(MAX_TEXT_CHARS, `Input must not exceed ${MAX_TEXT_CHARS} characters`),

  /** Optional context variables for dynamic prompts (e.g., targetLang) */
  context: z.record(z.string(), z.string()).optional().default({})
});

export type DevToolRequest = z.infer<typeof DevToolRequestSchema>;

// ─── Shared response types ───────────────────────────────────────────────────

export interface SuccessResponse {
  ok: true;
  content: string;
  provider: string;
}

export interface ErrorResponse {
  ok: false;
  error: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;
