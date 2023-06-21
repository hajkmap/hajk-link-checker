const os = require("os");
const fs = require("fs");
const config = require("../config.json").sendmail;
const computerName = os.hostname();

let sendmail = require("sendmail")({
  logger: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
  silent: false,
  smtpHost: config.smtpHost,
  smtpPort: config.smtpPort,
  devHost: config.smtpHost,
  devPort: config.smtpPort,
});

let mailData = {
  from: config.from.replace("{0}", computerName),
  to: config.to.join(","),
  subject: config.subject,
  html: config.html,
};

function send(subject, html, filePaths, cb) {
  let data = { ...mailData };
  data.subject = data.subject.replace("{0}", subject);
  data.html = data.html.replace("{0}", html);

  let attachments = [];

  filePaths.forEach((path) => {
    attachments.push({
      filename: path.substr(path.lastIndexOf("/") + 1),
      content: fs.readFileSync(path),
      contentType: "text/html",
    });
  });

  data.attachments = attachments;

  sendmail(data, (err, reply) => {
    // console.log(err && err.stack);
    // console.dir(reply);
    if (cb) {
      cb();
    }
  });
}

module.exports = {
  send: send,
};
