const config = require("../config.json");
let fs = require("fs");
const { sso } = require("node-expose-sspi");
let client = new sso.Client();

let que = [];
let _urlDataList;
let gPromise;
let gPromiseResolve;

function cleanUp() {
  _urlDataList.forEach((o) => {
    // count = o.urls.length;
    // remove duplicates.
    // o.layers.forEach(layer => {
    //   let c = layer.urls ? layer.urls.length : 0;
    //   // layer.urls = c > 0 ? [... new Set(layer.urls)] : [];
    //   if(!layer.urls) {
    //     layer.urls = [];
    //   }
    //   layer.duplicatesRemoved = c - layer.urls.length;
    //   count += layer.urls.length;
    // })
    o.totalNumberOfUrls = o.urls.length;
  });
}

function fetchQue(urlDataList) {
  _urlDataList = urlDataList;
  _urlDataList.forEach((o) => {
    o.layers.forEach((l) => {
      que.push(l);
    });
  });
  gPromise = new Promise((resolve, reject) => {
    gPromiseResolve = resolve;
  });
  fetchQue2();
  return gPromise;
}

function fetchQue2() {
  let layer = que.shift();
  if (!layer) {
    cleanUp();
    console.log("Fetched features");
    gPromiseResolve({ success: true });
    return;
  }
  fetch(layer.url).then((data) => {
    // console.log(`Url: ${layer.url}\nstatusCode:${data.statusCode}`)
    if (data.statusCode < 400) {
      let source = layer.url.substr(layer.url.indexOf("/geoserver/") + 11);
      source = source.substr(0, source.indexOf("/")).replace("/", "");

      let body = data.body;

      if (body.features) {
        layer.urls = [];
        // console.log(`${body.numberReturned} / ${body.numberMatched} features fetched...`);
        layer.featuresReturned = body.numberReturned;
        layer.featuresMatched = body.numberMatched;
        body.features
          .filter((f) => f.properties && f.properties.url)
          .forEach((f) => {
            // console.log(f.properties.url);
            layer.urls.push({
              url: f.properties.url,
              id: f.id,
              key: "-",
              source: source,
              wmsUrl: layer.url,
            });
          });
        body = null;
      }
    }
    fetchQue2();
  });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    client
      .fetch(url)
      .then((res) => {
        if (res.status < 400) {
          res.json().then((data) => {
            resolve({
              body: res.status < 400 ? data : {},
              statusCode: res.status,
            });
          });
        } else {
          resolve({
            body: {},
            statusCode: res.status,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

module.exports = {
  fetch: fetch,
  fetchQue: fetchQue,
};
