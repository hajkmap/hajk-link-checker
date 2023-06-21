const fs = require("fs");
const blc = require("broken-link-checker");

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36";

let cMap = {};
let gPromise;
let gPromiseResolve;

let urlChecker = new blc.UrlChecker(
  { cacheResponses: true, userAgent: userAgent /*, requestMethod: 'GET'*/ },
  {
    link: function (result, o) {
      if (cMap[o.url]) {
        // DIY simple result cache, the build in is weird.
        o.result = { ...cMap[o.url].result };
      } else {
        o = applyResults(o, result);
        cMap[o.url] = { result: o.result };
      }
      // console.log(o.url);
    },
    end: function () {
      cMap = {};
      console.log("Url checking completed.");
      gPromiseResolve({ data: list });
    },
  }
);

function applyResults(o, result) {
  o.result = { statusCode: "-", statusMessage: "-" };

  if (result.http.response) {
    o.result = {
      statusCode: result.http.response.statusCode,
      statusMessage: result.http.response.statusMessage,
    };
  }

  o.result.broken = result.broken === true ? true : false;

  if (o.key === "getCapabilities") {
    // let 401 (unauthorized) pass, if it was missing it would be 404....
    if ("" + o.result.statusCode === "401") {
      o.result.broken = false;
    }
  }

  o.result.brokenReason =
    o.result.statusCode === "-" ? result.brokenReason : null;
  o.result.redirected = result.url.redirected ? true : false;
  o.url = o.url.trim();

  if (o.result.redirected === true) {
    o.result.redirectedToUrl = result.url.redirected;
  }

  return o;
}

let list = null;

function run(inputList) {
  console.log(`Checking ${inputList.length} urls`);
  gPromise = new Promise((resolve, reject) => {
    gPromiseResolve = resolve;
  });
  urlChecker.clearCache();
  list = inputList;
  list.forEach((o) => {
    urlChecker.enqueue(o.url.trim(), null, o);
  });
  return gPromise;
}

module.exports = { run: run };
