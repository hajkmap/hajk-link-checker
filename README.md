# Hajk link checker

NOTE: Currently 2 breaking issues...
1. Does not work with consolidated loading in NodeJS backend.
2. Does not work with node v20+ because of node-expose-sspi (which is not updated for ages).

Note that this is a rapidly built app with alot of missing error handling. Let's call it a working prototype.

Note that this application was intended for Hajk2 and slightly modified to work with Hajk3+ so the code is not the most modern.

It is provided in current state because people have asked for it.

Lets have a copy of the app here for now, as reference, but feel free to use and modify it as you please.

```
npm install
npm run start
```

### Base functionality

- Check for broken urls in layerconfig, (infotext etc)
- Check for broken WMS (getCapabilities)
- Check WMS/WFS for broken urls in features (first 500/50 configurable).
- JSON Report data are created
- HTML Reports are created
- Send HTML report to specified email

### Config?

```json 
{
  "general": {
    "reportDataPath": "./report-data/", // json report data
    "reportPath": "./reports/", // html reports
    "logPath": "./logs/" 
  },
  "hajkLayerConfigs": [
    {
      "id": "Varbergskartan", // Title would be a better name
      "url": "https://aaaaaaaa-konf.varberg.se/mapservice/config/layers", // url to layerconfig in backend
      "include": true // include when running?
    },
    {
      "id": "Kommungis", // Title would be a better name
      "url": "https://bbbbbbbb-konf.varberg.se/mapservice/config/layers", // url to layerconfig in backend
      "include": true // include when running?
    }
  ],
  "wfs": {
    "qs": "?service=wfs&version=2.0.0&request=GetFeature&typeNames={layerName}&count={count}&outputFormat=json",
    // wms is converted to wfs in this old-school way using formatted string above
    "maxCount": 500, // max features to get (internal)
    "maxCountExt": 50 // max features to get (external)
  },
  "getCapabilities": {
    "qs": "?service=WMS&request=GetCapabilities&version={version}" // used to check if wms is broken, we do not like 404
  },
  "sendmail": {
    "subject": "Hajk link report {0}",
    "html": "Hajk link reports attached<br><br><strong>Summary:</strong><br>{0}",
    "from": "{0}@varberg.se", // {0} is replaced with computername of the running computer.
    "to": ["jesper.adeborn@dummy-email.com"],
    "smtpHost": "xxxxxxxxxxx-se.mail.protection.outlook.com",
    "smtpPort": 25
  }
}
```
