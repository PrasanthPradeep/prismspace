import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Corpta",
  "headMarkup": "<style>\n        @font-face {\n            font-family: 'Corpta';\n            src: url('../fonts/corpta.ttf') format('truetype');\n        }\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'Corpta', sans-serif;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 4rem;\n            font-weight: 400;\n            color: white;\n            text-shadow: 0 3px 18px rgba(0, 0, 0, 0.35);\n            letter-spacing: 0.05em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.2);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [],
  "externalScripts": [
    "/converted-inline/clock-corpta.js"
  ]
};

export const title = page.title;

export default function Corpta() {
  return <LegacyHtmlPage {...page} />;
}
