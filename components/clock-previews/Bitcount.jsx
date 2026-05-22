import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Bitcount",
  "headMarkup": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single:wght@100..900&display=swap\" rel=\"stylesheet\">\n    <style>\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'Bitcount Grid Single', monospace;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 4rem;\n            font-weight: 500;\n            color: #ffffff;\n            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 3px 18px rgba(0, 0, 0, 0.35);\n            letter-spacing: 0.2em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.2);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [],
  "externalScripts": [
    "/converted-inline/clock-bitcount.js"
  ]
};

export const title = page.title;

export default function Bitcount() {
  return <LegacyHtmlPage {...page} />;
}
