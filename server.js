const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const puppeteer = require("puppeteer");
const express = require("express");

// create socket.io server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

let seedVideoId = "u2vJp-0s8xQ"; // first video in crawl path
let videoId = seedVideoId;
let crawlLength = 0;

const XMLHttpRequest = require("xhr2");
const Http = new XMLHttpRequest();
Http.responseType = "json";
Http.readyState = 4;

// set static folder
app.use(express.static(path.join(__dirname, "public")));

// run when client connects
io.on("connection", (socket) => {
  console.log("New websocket connection...");

  // welcome current user
  socket.emit("message", {
    id: videoId,
    message: "ID: " + videoId + ", Crawl length: " + crawlLength,
  });
});

const PORT = process.env.port || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function crawlYoutube() {
  // start browser and open page
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--window-size=${1920},${1080}`,
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  // go to video id of seed video
  await page.goto("https://www.youtube.com/watch?v=" + videoId);

  // make a bunch of screenshots to see what the bot is doing
  setInterval(() => {
    page.screenshot({ path: "browser.png" });
  }, 1000);

  // close cookies dialog
  let elem = await page.waitForXPath(
    "//*[@aria-label='Agree to the use of cookies and other data for the purposes described']"
  );
  await elem.click();

  while (true) {
    try {
      // get first next video
      elem = await page.waitForXPath(
        "//ytd-compact-video-renderer//yt-interaction[contains(@class, 'ytd-compact-video-renderer')]"
      );

      // get video id of next video
      let elems_href = await page.$x("//ytd-compact-video-renderer//a");
      let elem_href = elems_href[0];
      let href = await elem_href.getProperty("href");
      let raw_href = await href.jsonValue();
      let current_videoId = raw_href.substring(raw_href.indexOf("=") + 1);
      videoId = current_videoId;

      // check if video is embeddable
      canSkipVideo = false;
      Http.open(
        "GET",
        "https://www.googleapis.com/youtube/v3/videos?id=" +
          videoId +
          "&key=AIzaSyDSCiGd1GZJmcU9xPd7O-rSPjNkS4fp61k&part=status"
      );
      Http.send();
      Http.onreadystatechange = (e) => {
        if (Http.readyState == 4 && Http.status == 200) {
          if (Http.response != null) {
            if (!Http.response.items[0].status.embeddable) {
              canSkipVideo = true;
              console.log(
                `${current_videoId} is not embeddable, skipping to next video`
              );
            }
            Http.onreadystatechange = undefined;
          }
        }
      };

      // go to next video
      elem.click();

      crawlLength++;

      // send video id and page title to clients
      io.emit("message", {
        id: videoId,
        message: "ID: " + videoId + ", Crawl length: " + crawlLength,
      });

      console.log(videoId);

      // wait for play button to appear

      await delay(1000);

      // stop playing new video
      let elem_play_button = await page.waitForXPath(
        "//ytd-watch-flexy//button[@class='ytp-play-button ytp-button']"
      );
      elem_play_button.click();

      // show video for 10 seconds
      if (!canSkipVideo) {
        await delay(10000);
      }
    } catch (error) {
      page.screenshot({ path: "puppeteerError.png" });
      console.log(
        "error encountered while crawling YouTube, restarting browser"
      );

      // restart whole crawl process
      crawlYoutube();
      return;
    }
  }
}

// makes async function wait
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// start crawling ad infinitum
crawlYoutube();
