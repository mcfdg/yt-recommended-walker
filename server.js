const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const puppeteer = require("puppeteer");

const express = require("express");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let text = undefined;
let puppeteerBusy = false;

// set static folder

app.use(express.static(path.join(__dirname, "public")));

// run when client connects
io.on("connection", (socket) => {
  console.log("New websocket connection...");

  // welcome current user
  socket.emit("message", text);
});

const PORT = process.env.port || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function getData() {
  puppeteerBusy = true;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setDefaultTimeout(0);

  await page.goto("https://randomwordgenerator.com/sentence.php");

  const elem = await page.waitForXPath("//*[@class='support-sentence']");

  const textObj = await elem.getProperty("textContent");
  text = await textObj.jsonValue();
  console.log({ text });

  browser.close();

  io.emit("message", text);

  puppeteerBusy = false;
}

getData();

setInterval(() => {
  if (!puppeteerBusy) getData();
}, 10000);
