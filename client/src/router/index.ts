import { createRouter, createWebHistory } from "vue-router";
import Home from "../components/Home.vue";
import CreateRoom from "../components/CreateRoom.vue";
import JoinRoom from "../components/JoinRoom.vue";
import GameRoom from "../components/GameRoom.vue";
import GameFinished from "../components/GameFinished.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/create", component: CreateRoom },
  { path: "/join", component: JoinRoom },
  { path: "/finished", component: GameFinished },
  { path: "/room/:roomCode", name: "GameRoom", component: GameRoom, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
