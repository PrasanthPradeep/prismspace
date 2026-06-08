export type AssistantQuickAction = 'summarize' | 'save' | 'notes' | 'explain-selection' | 'interview';

export type AssistantPageContext = {
  pageTitle: string;
  pageUrl: string;
  extractedPageContent: string;
  selectedText: string;
  userQuery: string;
};

export type AssistantChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  status?: 'loading' | 'error' | 'done';
};

export type AssistantSavedPage = {
  id: string;
  url: string;
  title: string;
  summary: string;
  notes: string;
  timestamp: number;
};

export type AssistantUiState = {
  open: boolean;
  buttonTop: number;
  messages: AssistantChatMessage[];
};

export type AssistantAiRequest = AssistantPageContext & {
  action?: AssistantQuickAction | 'chat';
};

export type AssistantAiResponse = {
  ok: boolean;
  content?: string;
  error?: string;
};

export type AssistantSaveResponse = {
  ok: boolean;
  item?: AssistantSavedPage;
  error?: string;
};

