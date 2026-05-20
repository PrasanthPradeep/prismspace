import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';

const page = {
  "documentClassName": "legacy-clock-preview-document",
  "bodyClassName": "legacy-clock-preview-route",
  "title": "Zombiess",
  "headMarkup": "<style>\n        @font-face {\n            font-family: 'ZombiessDemoFont';\n            src: url('../fonts/ZombiessDemo.ttf') format('truetype');\n            font-weight: normal;\n            font-style: normal;\n            font-display: block;\n        }\n        body {\n            margin: 0;\n            padding: 0;\n            background: url('../images/BG.png') center/cover no-repeat;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            height: 100%;\n            font-family: 'ZombiessDemoFont', 'Courier New', monospace;\n            overflow: hidden;\n        }\n        .clock {\n            font-size: 5rem;\n            font-weight: normal;\n            color: #ffffff;\n            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 4px 20px rgba(0, 0, 0, 0.6);\n            letter-spacing: 0.05em;\n            font-family: 'ZombiessDemoFont', 'Courier New', monospace;\n        }\n    </style>",
  "bodyMarkup": "<div class=\"clock\" id=\"clock\">12:24</div>",
  "scripts": [
    "\n        function updateTime() {\n            const now = new Date();\n            const hours = String(now.getHours()).padStart(2, '0');\n            const minutes = String(now.getMinutes()).padStart(2, '0');\n            document.getElementById('clock').textContent = `${hours}:${minutes}`;\n        }\n        updateTime();\n        setInterval(updateTime, 1000);\n    "
  ],
  "externalScripts": []
};

export const title = page.title;

export default function Zombiess() {
  return <LegacyHtmlPage {...page} />;
}
