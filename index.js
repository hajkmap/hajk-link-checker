let fs = require("fs");
let util = require("util");
const config = require("./config.json");
let EmailSender = require("./js/EmailSender");
let GetLayerData = require("./js/GetLayerData");
let UrlChecker = require("./js/UrlChecker");
let GetLayerFeatures = require("./js/GetLayerFeatures");
let HtmlGenerator = require("./js/HtmlGenerator");
let UrlCollector = require("./js/UrlCollector");
let urlCollector = new UrlCollector();
const BOM = "\ufeff";

let layers = [...config.hajkLayerConfigs].filter((l) => l.include === true);
let logFile = `${config.general.logPath}console.log`;
let reportPaths = [];
let summary = {
  total: 0,
  broken: 0,
  redirected: 0,
};

function getDateTime() {
  let execDateTime = new Date()
    .toJSON()
    .replace(/\:/gi, "")
    .replace(/\-/gi, "");
  execDateTime = execDateTime.substr(0, execDateTime.indexOf("."));
  return execDateTime;
}

function renameLogIfNeeded() {
  if (!fs.existsSync(logFile)) {
    return;
  }
  let stats = fs.statSync(logFile);
  let bytes = stats.size;
  let kb = bytes / 1000;
  if (kb > 500) {
    fs.renameSync(
      logFile,
      logFile.replace(".log", "-backup-" + getDateTime() + ".log")
    );
  }
}

renameLogIfNeeded();
let logStream = fs.createWriteStream(logFile, { flags: "a+" });
let orgLog = console.log;

console.log = function () {
  logStream.write(util.format.apply(null, arguments) + "\n", function (err) {
    if (err) {
      console.log(err);
    }
  });
  orgLog.apply(console, arguments);
};

console.lineSeparator = function () {
  console.log(
    "───────────────────────────────────────────────────────────────────────────────"
  );
};

function sendReportEmail(subject, html, cb) {
  EmailSender.send(subject, html, reportPaths, cb);
}

function writeReportUrls(id, flatList, currentTime) {
  const fn = config.general.reportDataPath + `${id}-urls-${currentTime}.json`;
  fs.writeFileSync(fn, JSON.stringify({ urls: flatList }, null, 2));
  console.log(`Url report data written to ${fn}`);
}

function getFlatUrlList(list) {
  let flat = [];

  // console.log(list);

  list
    .filter((i) => i.totalNumberOfUrls > 0)
    .forEach((o) => {
      o.urls.forEach((u) => {
        flat.push(
          new urlCollector.urlData(
            o.caption,
            "layerconfig",
            o.id,
            u.key,
            u.url,
            u.wmsUrl
          )
        );
      });

      o.layers.forEach((layer) => {
        layer.urls.forEach((lo) => {
          // console.log(lo);
          flat.push(
            new urlCollector.urlData(
              `wms: ${layer.name}`,
              lo.source,
              lo.id,
              lo.key,
              lo.url,
              lo.wmsUrl
            )
          );
        });
      });
    });

  return flat;
}

function outputReport(layerData, currentTime, list, cb) {
  let flat = getFlatUrlList(list);

  UrlChecker.run(flat).then((d) => {
    summary.broken += d.data.filter(
      (o) => o.result && o.result.broken === true
    ).length;
    summary.redirected += d.data.filter(
      (o) => o.result && o.result.redirected === true
    ).length;
    summary.total += d.data.length;

    writeReportUrls(layerData.id, d.data, currentTime);

    let html = HtmlGenerator.run(layerData.id, d.data);
    const fn2 =
      config.general.reportPath + `${layerData.id}-report-${currentTime}.html`;
    fs.writeFileSync(fn2, html);
    reportPaths.push(fn2);
    console.log(`Report html written to ${fn2}`);
    cb();
  });
}

function createReportData() {
  urlCollector.clear();
  let layerData = layers.shift();

  if (!layerData) {
    console.lineSeparator();
    console.log("Results:");
    console.table({
      "Total links tested": summary.total,
      "Broken links": summary.broken,
      "Redirected links": summary.redirected,
    });

    let html = `<table>\n
    <tr><td>Total links tested: </td><td>${summary.total}</td></tr>\n
    <tr><td>Broken links: </td><td>${summary.broken}</td></tr>\n
    <tr><td>Redirected links: </td><td>${summary.redirected}</td></tr>
    \n</table>`;

    console.log("Sending mail to: " + config.sendmail.to.join(","));
    sendReportEmail("", html, () => {
      console.timeEnd("Completed in");
      process.exit(0);
    });

    return;
  }

  GetLayerData.fetch(layerData.url).then((data) => {
    urlCollector.getUrlsFromLayerConfig(data.data);

    GetLayerFeatures.fetchQue(urlCollector.urlDataList).then((d) => {
      const currentTime = getDateTime();

      outputReport(
        layerData,
        currentTime,
        urlCollector.urlDataList,
        function () {
          createReportData();
        }
      );
    });
  });
}

console.log("\n");
console.lineSeparator();
console.log("Started", getDateTime());
console.time("Completed in");
createReportData();
