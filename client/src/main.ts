import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { clerkPlugin } from "@clerk/vue";
import router from "./router";
import Home from "./components/Home.vue";
import CreateRoom from "./components/CreateRoom.vue";
import JoinRoom from "./components/JoinRoom.vue";
import GameRoom from "./components/GameRoom.vue";
import Canvas from "./components/Canvas.vue";
import { useSocket } from "./socket.ts";
import GameFinished from "./components/GameFinished.vue";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(".env problem");
}

const socket = useSocket()
const app = createApp(App);

app.component("Home", Home);
app.component("CreateRoom", CreateRoom);
app.component("JoinRoom", JoinRoom);
app.component("GameRoom", GameRoom);
app.component("Canvas", Canvas);
app.component("GameFinished", GameFinished);
app.config.globalProperties.$socket = socket;

app.use(clerkPlugin, { publishableKey: PUBLISHABLE_KEY });
app.use(router);
app.mount("#app");
