const fs = require("fs");

function run(title, list) {
  let output = fs.readFileSync("./templates/template.html", "utf8");
  let part = fs.readFileSync("./templates/part.html", "utf8");

  let col = [
    "title",
    "id",
    "source",
    "key",
    "statusCode",
    "statusMessage",
    "broken",
    "redirected",
    "url",
  ];

  let headers = "";
  col.forEach((t) => {
    headers += `\n<th>${t}</th>`;
  });

  part = part.replace(/\{headers\}/gi, headers);
  part = part.replace(/\{title\}/gi, title);
  output = output.replace(/\{title\}/gi, title);

  let rows = [];
  let rowsBroken = [];

  list.map((o) => {
    if (!o.result) {
      o.result = { broken: true };
    }
  });

  list
    .sort(
      (a, b) =>
        b.result.broken - a.result.broken ||
        b.result.redirected - a.result.redirected
    )
    .forEach((o) => {
      let cssClass = o.result.broken === true ? "error" : "";
      if (o.result.broken !== true) {
        cssClass = o.result.redirected === true ? "warn" : "";
      }

      let r = "<tr>\n";
      r += `<td><span title="${o.wmsUrl}">${o.title}</span></td>\n`; // title
      r += `<td>${o.id}</td>\n`; // id
      r += `<td>${o.source}</td>\n`;
      r += `<td>${o.key}</td>\n`; //
      r += `<td class="${cssClass}">${o.result.statusCode}</td>\n`;
      r += `<td class="${cssClass}">${o.result.statusMessage}</td>\n`;
      r += `<td class="${cssClass}">${
        o.result.broken === true ? "true" : "false"
      }</td>\n`;

      if (o.result.redirected === true) {
        r += `<td class="${cssClass} bold"><a href="${o.result.redirectedToUrl}" target="test" title="Redirected to:\n${o.result.redirectedToUrl}">true</a></td>\n`;
      } else {
        r += `<td class="${cssClass}">false</td>\n`;
      }

      r += `<td class="${cssClass}"><a href="${o.url}" title="${o.url}" target="test">${o.url}</a></td>\n`;
      r += "</tr>\n";

      rows.push(r);
    });

  part = part.replace(/\{rows\}/, rows.join(""));
  output = output.replace(/\{parts\}/, part);

  return output;
}

module.exports = {
  run: run,
};
