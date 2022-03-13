const socket = io();

const h1 = document.getElementsByClassName("myText")[0];

h1.innerHTML = "success";

var tag = document.createElement("script");

let videoId = "M7lc1UVf-VE";

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player_loaded = false;

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    width: 100 + "%",
    height: 100 + "%",
    videoId: videoId,
    playerVars: {
      playsinline: 1,
      autoplay: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
  player.loadVideoById(videoId);
  console.log("player is ready");
  player_loaded = true;
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    setTimeout(stopVideo, 6000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}

socket.on("message", (message) => {
  console.log("new video");
  console.log(message);
  videoId = message.id;
  h1.innerHTML = message.message;
  if (player_loaded) {
    player.loadVideoById(videoId);
    console.log(message)
  } else console.log("player not yet loaded");
});
