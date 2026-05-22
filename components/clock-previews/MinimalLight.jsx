import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "MinimalLight",
  "headMarkup": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap\" rel=\"stylesheet\">\n    <style>\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            overflow: hidden;\n        }\n        .clock {\n            font-family: \"Permanent Marker\", cursive;\n            font-weight: 400;\n            font-style: normal;\n            font-size: 4rem;\n            color: rgba(255, 255, 255, 0.95);\n            text-shadow: 0 2px 20px rgba(255, 255, 255, 0.5);\n            letter-spacing: 0.1em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.15);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [],
  "externalScripts": [
    "/converted-inline/clock-minimallight.js"
  ]
};

export const title = page.title;

export default function MinimalLight() {
  return <LegacyHtmlPage {...page} />;
}
