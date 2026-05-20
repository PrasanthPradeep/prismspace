import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Ghetto",
  "headMarkup": "<style>\n        @font-face {\n            font-family: 'Ghetto';\n            src: url('../fonts/ghetto font.ttf') format('truetype');\n            font-weight: normal;\n            font-style: normal;\n        }\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'Ghetto', sans-serif;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 3.5rem;\n            font-weight: normal;\n            color: white;\n            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);\n            letter-spacing: 0.05em;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [
    "\n        function updateTime() {\n            const now = new Date();\n            const hours = String(now.getHours()).padStart(2, '0');\n            const minutes = String(now.getMinutes()).padStart(2, '0');\n            document.getElementById('clock').textContent = `${hours}:${minutes}`;\n        }\n        updateTime();\n        setInterval(updateTime, 1000);\n    "
  ],
  "externalScripts": []
};

export const title = page.title;

export default function Ghetto() {
  return <LegacyHtmlPage {...page} />;
}
