const config = require("../config.json");

module.exports = function () {
  let _this = this;
  this.layerConfig = null;
  this.urlDataList = [];
  this.svChars = "åäöÅÄÖ".split("");

  this.urlData = function (title, source, id, prop, url, wmsUrl) {
    return {
      title: title,
      source: source,
      id: id,
      key: prop,
      url: _this.fixEncoding(url),
      wmsUrl: wmsUrl,
    };
  };

  this.clear = function () {
    this.urlDataList = [];
  };

  this.fixEncoding = function (url) {
    // åäöÅÄÖ works fine in the browser, but not in the node environment it seams. Encode!
    this.svChars.forEach((ch) => {
      url = url.replace(new RegExp(ch, "g"), encodeURIComponent(ch));
    });
    return url;
  };

  this.applyFeatureUrls = function (url, layers) {
    // At the time of writing.... an wfs url looks approximately like this:
    // https://wms.varberg.se/geoserver/fgf_v1/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=forskola&outputFormat=json

    let _layers = [];

    const baseUrl = url.substr(0, url.lastIndexOf("/wms")) + "/wfs";
    const isExternal = url.indexOf("/geoserver/ext_") > -1 ? true : false;
    const maxCountToFetch =
      isExternal === true ? config.wfs.maxCountExt : config.wfs.maxCount;

    layers.forEach((l) => {
      _layers.push({
        name: l,
        isExternal: isExternal,
        url:
          baseUrl +
          config.wfs.qs
            .replace("{layerName}", l)
            .replace("{count}", maxCountToFetch),
        urls: [],
      });
    });

    return _layers;
  };

  this.checkLayerPropForUrl = function (layer, propName) {
    const pv = layer[propName];
    if (pv && typeof pv === "string" && pv.trim() != "") {
      const matches = pv.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/);
      if (matches && matches.length > 1) {
        let url = matches[1].trim();
        if (url.indexOf("{") === -1) {
          return this.fixEncoding(url).trim();
        }
      }
    }
    return null;
  };

  this.getUrlsFromLayerConfig = function (conf) {
    this.layerConfig = conf;

    const add = (layer) => {
      let data = {
        id: layer.id,
        layers: this.applyFeatureUrls(layer.url, layer.layers),
        caption: layer.caption,
        url: layer.url,
        getCapabilitiesUrl: "",
        urls: [],
      };

      if (layer.url && layer.url !== "" && config.getCapabilities.qs !== "") {
        layer.getCapabilitiesUrl =
          layer.url +
          config.getCapabilities.qs.replace(
            "{version}",
            layer.version || "1.1.1"
          );

        data.urls.push({
          source: "wms",
          key: "getCapabilities",
          url: layer.getCapabilitiesUrl,
          wmsUrl: "",
        });
      }

      Object.keys(layer).forEach((key, index) => {
        let pu = this.checkLayerPropForUrl(layer, key);

        if (pu) {
          data.urls.push({
            source: "layerconfig",
            key: key,
            url: pu,
            wmsUrl: "",
          });
        }
      });

      if (layer.layersInfo && layer.layersInfo.length > 0) {
        // Add hajk3 compatibility
        layer.layersInfo.forEach((item) => {
          Object.keys(item).forEach((key, index) => {
            let pu = this.checkLayerPropForUrl(item, key);

            if (pu) {
              data.urls.push({
                source: "layerconfig",
                key: key,
                url: pu,
                wmsUrl: "",
              });
            }
          });
        });
      }

      this.urlDataList.push(data);
    };

    this.layerConfig.wmslayers.forEach((layer) => {
      if (layer.url.indexOf("/wms") > -1) {
        // Right now we can only handle our own services that ends with /wms.
        add(layer);
      }
    });
  };

  return this;
};
