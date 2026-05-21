import NotepadPanel, { title } from '@/components/dev-tools/NotepadPanel';
import { renderPage } from '@/src/extension/renderPage';

renderPage(NotepadPanel, { title: title });
