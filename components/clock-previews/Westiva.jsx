import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Westiva",
  "headMarkup": "<style>\n        @font-face {\n            font-family: 'Westiva';\n            src: url('../fonts/westiva-regular.otf') format('opentype');\n        }\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'Westiva', sans-serif;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 4rem;\n            font-weight: 400;\n            color: white;\n            text-shadow: 0 3px 18px rgba(0, 0, 0, 0.35);\n            letter-spacing: 0.08em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.2);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [],
  "externalScripts": [
    "/converted-inline/clock-westiva.js"
  ]
};

export const title = page.title;

export default function Westiva() {
  return <LegacyHtmlPage {...page} />;
}
