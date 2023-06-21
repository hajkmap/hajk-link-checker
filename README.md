# Hajk link checker

Note that this is a rapidly built app with alot of missing error handling. Let's call it a working prototype.

Note that this application was intended for Hajk2 and slightly modified to work with Hajk3+ so the code is not the most modern.

It is provided in current state because people have asked for it.

Lets have a copy of the app here for now, as reference, but feel free to use and modify it as you please.

```
npm install
npm run start
```

### Base functionality

- Placeholder

### Config?

```json
{
  "general": {
    "reportDataPath": "./report-data/",
    "reportPath": "./reports/",
    "logPath": "./logs/"
  },
  "hajkLayerConfigs": [
    {
      "id": "Varbergskartan",
      "url": "https://aaaaaaaa-konf.varberg.se/mapservice/config/layers",
      "include": true
    },
    {
      "id": "Kommungis",
      "url": "https://bbbbbbbb-konf.varberg.se/mapservice/config/layers",
      "include": true
    }
  ],
  "wfs": {
    "qs": "?service=wfs&version=2.0.0&request=GetFeature&typeNames={layerName}&count={count}&outputFormat=json",
    "maxCount": 500,
    "maxCountExt": 50
  },
  "getCapabilities": {
    "qs": "?service=WMS&request=GetCapabilities&version={version}"
  },
  "sendmail": {
    "subject": "Hajk link report {0}",
    "html": "Hajk link reports attached<br><br><strong>Summary:</strong><br>{0}",
    "from": "{0}@varberg.se",
    "to": ["jesper.adeborn@dummy-email.com"],
    "smtpHost": "xxxxxxxxxxx-se.mail.protection.outlook.com",
    "smtpPort": 25
  }
}
```
