const { sso } = require("node-expose-sspi");
const config = require("../config.json");

let client = new sso.Client();

function fetch(url) {
  return new Promise((resolve, reject) => {
    client
      .fetch(url)
      .then((res) => {
        res.json().then((data) => {
          console.log(
            "───────────────────────────────────────────────────────────────────────────────"
          );
          console.log(`Fetched layer data ${url}`);
          resolve({
            data: data,
          });
        });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

module.exports = {
  fetch: fetch,
};
