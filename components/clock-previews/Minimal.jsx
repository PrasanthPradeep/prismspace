import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Minimal",
  "headMarkup": "<style>\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'Space Grotesk', sans-serif;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 4rem;\n            font-weight: 300;\n            color: white;\n            text-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);\n            letter-spacing: 0.15em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.2);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [],
  "externalScripts": [
    "/converted-inline/clock-minimal.js"
  ]
};

export const title = page.title;

export default function Minimal() {
  return <LegacyHtmlPage {...page} />;
}
