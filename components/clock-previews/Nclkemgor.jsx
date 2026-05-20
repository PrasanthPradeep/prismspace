import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Nclkemgor",
  "headMarkup": "<style>\n        @font-face {\n            font-family: 'NCLKemgor';\n            src: url('../fonts/NCLKemgor-Demo.otf') format('opentype');\n        }\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'NCLKemgor', sans-serif;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 4rem;\n            font-weight: 400;\n            color: white;\n            text-shadow: 0 3px 18px rgba(0, 0, 0, 0.4);\n            letter-spacing: 0.05em;\n        }\n        .landscape {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 40px;\n            background: rgba(0, 0, 0, 0.2);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 2rem;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [
    "\n        function updateTime() {\n            const now = new Date();\n            const hours = String(now.getHours()).padStart(2, '0');\n            const minutes = String(now.getMinutes()).padStart(2, '0');\n            document.getElementById('clock').textContent = `${hours}:${minutes}`;\n        }\n        updateTime();\n        setInterval(updateTime, 1000);\n    "
  ],
  "externalScripts": []
};

export const title = page.title;

export default function Nclkemgor() {
  return <LegacyHtmlPage {...page} />;
}
