const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const puppeteer = require("puppeteer");

const express = require("express");
const { del } = require("express/lib/application");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let video_id = "bEETdGAVfD4";
let puppeteerBusy = false;
let crawlLength = 0;

// set static folder

app.use(express.static(path.join(__dirname, "public")));

// run when client connects
io.on("connection", (socket) => {
  console.log("New websocket connection...");

  // welcome current user
  socket.emit("message", {id: video_id, message: "ID: " +  video_id + ", Crawl length: " + crawlLength});
});

const PORT = process.env.port || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function crawlYoutube() {
  puppeteerBusy = true;
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setDefaultTimeout(0);

  await page.goto("https://www.youtube.com/watch?v=" + video_id);

  // setInterval(() => {
  //   page.screenshot({ path: "browser.png" });
  // }, 1000);

  let elem = await page.waitForXPath(
    "//tp-yt-paper-button[@aria-label='Agree to the use of cookies and other data for the purposes described']"
  );

  await elem.click();

  while (true) {
    elem = await page.waitForXPath(
      "//ytd-compact-video-renderer//yt-interaction[contains(@class, 'ytd-compact-video-renderer')]"
    );

    let elems_href = await page.$x("//ytd-compact-video-renderer//a");

    let elem_href = elems_href[0];
    let href = await elem_href.getProperty("href");
    elem.click();

    crawlLength++;

    let raw_href = await href.jsonValue();

    video_id = raw_href.substring(raw_href.indexOf("=") + 1);

    io.emit("message", {id: video_id, message: "ID: " +  video_id + ", Crawl length: " + crawlLength});

    console.log(video_id);

    await delay(1000);

    //stop playing new video
    let elem_play_button = await page.waitForXPath(
      "//ytd-watch-flexy//button[@class='ytp-play-button ytp-button']"
    );

    try {
      elem_play_button.click();
    } catch (error) {
      page.screenshot({ path: "playButtonClickError.png" });
      console.log(error);
    }

    await delay(10000);
  }
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

crawlYoutube();
