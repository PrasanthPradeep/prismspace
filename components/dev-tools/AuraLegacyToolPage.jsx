import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const AURA_FONT_IMPORTS = `
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,200;1,9..144,300&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
`;

const AURA_DESIGN_SYSTEM_STYLES = `
<style>
  :root {
    --p: #2D5016;
    --p-mid: #3D6B20;
    --p-bright: #4F8A2A;
    --p-soft: #EDF4E6;
    --p-container: #C8E6B0;
    --a: #8FAF00;
    --a-dark: #6D8600;
    --a-soft: #F5FAE0;
    --a-container: #DDF0A0;
    --t: #A0724A;
    --t-dark: #7A5235;
    --t-soft: #F5EDE4;
    --t-container: #E8D0BC;
    --s: #C8A96A;
    --s-dark: #9A7A3E;
    --s-soft: #FAF5EB;
    --w: #D97706;
    --w-soft: #FEF3C7;
    --bg: #F8F9F4;
    --surface: #FFFFFF;
    --surface-2: #F1F4EC;
    --surface-3: #E6ECDB;
    --ink: #141A0E;
    --ink-2: #3A4830;
    --ink-3: #7A8F6A;
    --border: #D8E2C8;
    --border-2: #BECE9E;
    --error: #C0392B;
    --error-soft: #FDECEA;
    --nav-bg: rgba(248, 249, 244, 0.92);
    --nav-border: rgba(216, 226, 200, 0.8);
    --fd: 'Cabinet Grotesk', sans-serif;
    --fs: 'Fraunces', Georgia, serif;
    --fm: 'Fira Code', monospace;
    --ease-spatial-fast: cubic-bezier(0.42, 1.67, 0.21, 0.90);
    --ease-spatial-default: cubic-bezier(0.38, 1.21, 0.22, 1.00);
    --ease-spatial-slow: cubic-bezier(0.39, 1.29, 0.35, 0.98);
    --ease-effects-fast: cubic-bezier(0.31, 0.94, 0.34, 1.00);
    --ease-effects-default: cubic-bezier(0.34, 0.80, 0.34, 1.00);
    --ease-effects-slow: cubic-bezier(0.34, 0.88, 0.34, 1.00);
    --dur-spatial-fast: 350ms;
    --dur-spatial-default: 500ms;
    --dur-spatial-slow: 650ms;
    --dur-effects-fast: 150ms;
    --dur-effects-default: 200ms;
    --dur-effects-slow: 300ms;
    --ease: var(--ease-effects-default);
    --spring: var(--ease-spatial-fast);
    --tf: var(--dur-effects-fast);
    --tn: var(--dur-effects-default);
    --ts: var(--dur-spatial-default);
    --shadow-raised: 0 4px 18px rgba(45, 80, 22, 0.14);
    --shadow-float: 0 8px 24px rgba(45, 80, 22, 0.12);
    --shadow-lift: 0 10px 28px rgba(45, 80, 22, 0.22);
  }

  [data-theme="dark"] {
    --p: #8DC85A;
    --p-mid: #A0D970;
    --p-bright: #B4EA84;
    --p-soft: #152808;
    --p-container: #2A4D14;
    --a: #C8E040;
    --a-dark: #DEFA50;
    --a-soft: #1A2200;
    --a-container: #2E3A00;
    --t: #D4A070;
    --t-dark: #E8B880;
    --t-soft: #1E1008;
    --t-container: #3C2018;
    --s: #E8CC8A;
    --s-dark: #F0DC9E;
    --s-soft: #1A1200;
    --w: #FBD34D;
    --w-soft: #1C1400;
    --bg: #0C1208;
    --surface: #141C0E;
    --surface-2: #1C2816;
    --surface-3: #263420;
    --ink: #DDEEC8;
    --ink-2: #A8C890;
    --ink-3: #608040;
    --border: #2A3C1E;
    --border-2: #3C5428;
    --error: #FF6B6B;
    --error-soft: #2C0E0E;
    --nav-bg: rgba(12, 18, 8, 0.92);
    --nav-border: rgba(42, 60, 30, 0.8);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.6);
      opacity: 0.5;
    }
  }
  @keyframes breathe {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(143, 175, 0, 0.4);
    }
    50% {
      transform: scale(1.2);
      box-shadow: 0 0 0 12px rgba(143, 175, 0, 0);
    }
  }
  @keyframes morphBlob {
    0%, 100% {
      border-radius: 60% 40% 70% 30% / 50% 60% 40% 60%;
    }
    33% {
      border-radius: 30% 70% 40% 60% / 60% 30% 70% 40%;
    }
    66% {
      border-radius: 50% 50% 30% 70% / 40% 70% 30% 60%;
    }
  }
  @keyframes morphShape {
    0%, 100% {
      border-radius: 40% 60% 60% 40% / 40% 60% 40% 60%;
    }
    50% {
      border-radius: 60% 40% 40% 60% / 60% 40% 60% 40%;
    }
  }
  @keyframes spinBounce {
    0% {
      transform: rotate(0deg) scale(1);
    }
    60% {
      transform: rotate(200deg) scale(1.2);
    }
    100% {
      transform: rotate(180deg) scale(1);
    }
  }
  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    background: var(--bg) !important;
    color: var(--ink) !important;
    font-family: var(--fd) !important;
    transition: background var(--dur-effects-slow) var(--ease-effects-slow), color var(--dur-effects-default) var(--ease-effects-default) !important;
  }

  .internet-banner,
  .inet-banner,
  [class*="banner"] {
    background: var(--w-soft) !important;
    color: var(--w) !important;
    border-bottom: 1px solid var(--w) !important;
    font: 400 11px/1.6 var(--fm) !important;
  }

  .header {
    background: var(--nav-bg) !important;
    border-bottom: 1px solid var(--nav-border) !important;
    transition: background var(--ts) var(--ease-spatial-default), border-color var(--ts) var(--ease-spatial-default) !important;
  }

  .header-title {
    font: 800 22px/1.05 var(--fd) !important;
    letter-spacing: -0.04em !important;
    color: var(--ink) !important;
    background: none !important;
    -webkit-text-fill-color: currentColor !important;
  }

  .close-btn {
    background: var(--error-soft) !important;
    border: 1.5px solid var(--error) !important;
    border-radius: 9999px !important;
    color: var(--error) !important;
    transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast), box-shadow var(--tf) var(--ease-effects-fast), background var(--tf) var(--ease-effects-fast) !important;
  }

  .close-btn:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: var(--shadow-raised) !important;
  }

  .toolbar,
  .actions-bar,
  .lang-row,
  .bottom-bar,
  .export-bar,
  .history-bar,
  .pane-header {
    background: var(--surface-2) !important;
    border-color: var(--border) !important;
    transition: background var(--tn) var(--ease), border-color var(--tn) var(--ease) !important;
  }

  .action-btn,
  .depth-btn,
  .run-main-btn,
  .conv-btn,
  .quiz-btn,
  .save-btn,
  .copy-btn,
  .add-crit-btn,
  .analyze-btn,
  .export-btn,
  .explain-toggle,
  .hist-chip,
  .swap-btn {
    font: 700 13px/1.3 var(--fd) !important;
    letter-spacing: -0.01em !important;
    border-radius: 9999px !important;
    border: 1.5px solid var(--border) !important;
    background: var(--surface) !important;
    color: var(--ink) !important;
    transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast), box-shadow var(--tf) var(--ease-effects-fast), background var(--tf) var(--ease-effects-fast), border-color var(--tf) var(--ease-effects-fast), color var(--tf) var(--ease-effects-fast) !important;
  }

  .action-btn:hover,
  .depth-btn:hover,
  .run-main-btn:hover,
  .conv-btn:hover,
  .quiz-btn:hover,
  .save-btn:hover,
  .copy-btn:hover,
  .add-crit-btn:hover,
  .analyze-btn:hover,
  .export-btn:hover,
  .explain-toggle:hover,
  .hist-chip:hover,
  .swap-btn:hover {
    border-color: var(--p) !important;
    background: var(--p-soft) !important;
    color: var(--p) !important;
    box-shadow: var(--shadow-raised) !important;
    transform: translateY(-2px) scale(1.02) !important;
  }

  .action-btn:active,
  .depth-btn:active,
  .run-main-btn:active,
  .conv-btn:active,
  .quiz-btn:active,
  .save-btn:active,
  .copy-btn:active,
  .add-crit-btn:active,
  .analyze-btn:active,
  .export-btn:active,
  .explain-toggle:active,
  .hist-chip:active,
  .swap-btn:active {
    transform: scale(0.97) !important;
  }

  .action-btn.active,
  .depth-btn.active,
  .run-main-btn,
  .conv-btn,
  .analyze-btn,
  .chip.on,
  .explain-toggle.on {
    background: var(--p) !important;
    border-color: var(--p-mid) !important;
    color: var(--bg) !important;
    box-shadow: var(--shadow-raised) !important;
  }

  .pane-label,
  .field-label,
  .diff-hdr,
  .pc-title,
  .section-hdr,
  .plan-tier,
  .token-counter {
    font-family: var(--fm) !important;
    color: var(--p-bright) !important;
    letter-spacing: 0.12em !important;
    text-transform: uppercase !important;
  }

  .pane,
  .left-pane,
  .right-pane,
  .input-col,
  .output-col,
  .section-card,
  .section-block,
  .quiz-card,
  .comp-card,
  .result-area,
  .output-area,
  .diff-section,
  .pros-list,
  .cons-list,
  .recommendation-box {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--ink) !important;
    transition: background var(--tn) var(--ease), border-color var(--tn) var(--ease), color var(--tn) var(--ease) !important;
  }

  .input-textarea,
  .code-area,
  .field-input,
  .field-textarea,
  .demo-inp,
  input,
  textarea,
  select {
    width: 100%;
    background: var(--bg) !important;
    border: 1.5px solid var(--border) !important;
    border-radius: 12px !important;
    color: var(--ink) !important;
    font: 400 14px/1.7 var(--fd) !important;
    outline: none !important;
    transition: border-color var(--tf) var(--ease-effects-fast), box-shadow var(--tf) var(--ease-effects-fast), background var(--tn) var(--ease) !important;
  }

  .code-area,
  .output-area,
  .token-counter,
  .streaming-cursor {
    font-family: var(--fm) !important;
  }

  .input-textarea:focus,
  .code-area:focus,
  .field-input:focus,
  .field-textarea:focus,
  .demo-inp:focus,
  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--p) !important;
    box-shadow: 0 0 0 3px var(--p-soft) !important;
  }

  .result-placeholder,
  .output-placeholder,
  .placeholder-msg,
  .hist-empty,
  .thinking-note {
    color: var(--ink-3) !important;
  }

  .concept-link {
    color: var(--p) !important;
    border-bottom-color: var(--p-container) !important;
  }

  .concept-link:hover {
    color: var(--p-mid) !important;
    border-bottom-color: var(--p-mid) !important;
  }

  .crit-item {
    border: 1.5px solid var(--border) !important;
    background: var(--surface) !important;
    color: var(--ink-2) !important;
    transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast), background var(--tn) var(--ease), border-color var(--tn) var(--ease), box-shadow var(--tn) var(--ease) !important;
  }

  .crit-item:hover {
    border-color: var(--p) !important;
    background: var(--p-soft) !important;
    transform: translateY(-2px) !important;
  }

  .crit-item.checked {
    border-color: var(--p) !important;
    background: var(--p-soft) !important;
    color: var(--p) !important;
  }

  .crit-check {
    border-color: var(--border-2) !important;
  }

  .crit-item.checked .crit-check {
    border-color: var(--p) !important;
    background: var(--p) !important;
  }

  .quiz-ans,
  .error-msg {
    border-radius: 12px !important;
    border-left: 2px solid var(--p) !important;
    background: var(--p-soft) !important;
    color: var(--ink-2) !important;
  }

  .toast,
  .toast-dot {
    font-family: var(--fd) !important;
  }

  .toast-dot,
  .token-dot {
    background: var(--a) !important;
    animation: pulse 2s ease-in-out infinite !important;
  }

  .token-dot.idle {
    background: var(--border-2) !important;
    animation: none !important;
  }

  .streaming-cursor {
    width: 2px !important;
    background: var(--a) !important;
    animation: blink var(--dur-effects-slow) var(--ease-effects-default) infinite !important;
  }

  th,
  td {
    border-bottom-color: var(--border) !important;
    color: var(--ink-2) !important;
  }

  th {
    color: var(--ink-3) !important;
  }

  .score-fill {
    background: var(--p) !important;
  }

  .rec-title,
  .section-hdr-title {
    color: var(--ink) !important;
    font: 800 18px/1.2 var(--fd) !important;
    letter-spacing: -0.03em !important;
    text-transform: none !important;
  }

  .section-body,
  .pc-item,
  .plan-feat {
    color: var(--ink-2) !important;
    font: 400 14px/1.7 var(--fd) !important;
  }

  .section-hdr {
    transition: background var(--tn) var(--ease), border-color var(--tn) var(--ease), transform var(--dur-spatial-fast) var(--ease-spatial-fast) !important;
  }

  .section-hdr:hover {
    background: var(--surface-2) !important;
  }

  ::placeholder {
    color: var(--ink-3) !important;
    opacity: 1 !important;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--surface-2);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-2);
    border-radius: 9999px;
  }
</style>
`;

function stripLegacyFontLinks(markup = '') {
  return markup
    .replace(/<link[^>]+fonts\.googleapis[^>]*>\s*/gi, '')
    .replace(/<link[^>]+api\.fontshare[^>]*>\s*/gi, '');
}

function withAuraDesignSystem(headMarkup = '') {
  const cleanedHeadMarkup = stripLegacyFontLinks(headMarkup);
  return `${AURA_FONT_IMPORTS}\n${cleanedHeadMarkup}\n${AURA_DESIGN_SYSTEM_STYLES}`;
}

export default function AuraLegacyToolPage({
  headMarkup = '',
  ...rest
}) {
  return (
    <LegacyHtmlPage
      {...rest}
      headMarkup={withAuraDesignSystem(headMarkup)}
    />
  );
}
