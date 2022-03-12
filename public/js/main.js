const socket = io();

const h1 = document.getElementsByClassName("myText")[0];

h1.innerHTML = "success";

socket.on("message", (message) => {
  h1.innerHTML = message;
});
