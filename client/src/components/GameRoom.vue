<template>
  <div class="game-space">
    <div class="game-container">
      <div class="leaderboard">
        <h3>Points</h3>
        <div class="leaderboard-container">
          <div 
            v-for="(player, i) in leaderboard" 
            :key="i" 
            class="message">
            <strong>{{ player.username }}:</strong> {{ player.points }}
          </div>
        </div>
          
        </div>
      <div class="game-info">
        <h1 v-if="!gameStarted">Welcome to Room {{ roomCode }}</h1>
        <p v-if="!gameStarted">Players in this room:</p>
        <p v-if="!gameStarted">
          <input v-model="username" placeholder="Enter Username" />
        </p>
        <!--
        <ul v-if="!gameStarted">
          <li v-for="player in players" :key="player">{{ player }}</li>
        </ul>
        -->
        <button @click="start" :disabled="!username">Start</button>
        <!-- do a v-if here to check if they are drawer, we need to make the distinction-->
        <button @click="getPrompt" :disabled="!username">Get Prompt</button>

        <div v-if="gameStarted && isDrawer" class="prompt-box">Prompt: {{ gamePrompt }}</div>

        <!-- Will need to make a side tab on left for points display, also need to discuss how points will be awarded-->
        <Canvas v-if="gameStarted"></Canvas>
      </div>


      

      <div class="chat-container">
        <h3>Chat</h3>
        <div class="mes-container" ref="messageContainer">
          <div 
            v-for="(message, i) in mes" 
            :key="i" 
            class="message"
            :class="{ 'system-message': message.sender === 'System' }"
          >
            <strong>{{ message.sender }}:</strong> {{ message.text }}
          </div>
        </div>
        <div v-if="!isDrawer" class="input-container">
          <input 
            v-model="curmes" 
            @keyup.enter="sendMessage" 
            placeholder="New message" 
            type="text" 
          />
          <button @click="sendMessage">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, ref, onMounted } from "vue";
import type { Ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSocket } from "../socket.ts";
  
interface Message {
  sender: string;
  text: string;
}

interface Leaderboard {
  username: string;
  points: number;
}

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();

    const roomCode = route.params.roomCode as string;
    const socket = useSocket();
    const gameStarted = ref(false);
    const players = ref<string[]>([]);
    let category: string;
    const username = ref("");
    const gamePrompt = ref<string | null>(null);
    const leaderboard = ref<Leaderboard[]>([]);
    const mes = ref<Message[]>([]);
    // use quotes or apostrophes but keep it consistent ;(
    // mb lol - i usually use quotes
    const curmes = ref("");
    const messageContainer: Ref<HTMLDivElement | null> = ref(null);
    const isDrawer = ref(false);

    onMounted(() => {
      socket.emit("getRoomDetails", {roomCode});
    });
    
    socket.on("roomDetails", (data) => {
      console.log("received room details!")
      leaderboard.value.length = 0; // clear array
      data.players.forEach((player: string) => {
        leaderboard.value.push({
          username: player,
          points: 0,
        })
      });
      category = data.category;

      if (data.drawerId == socket.id) {
        isDrawer.value = true;
      } else {
        isDrawer.value = false;
      }
    });

    socket.on("updatePoints", (data) => {
      leaderboard.value.forEach((player) => {
        if (player.username == data.player) {
          player.points = data.points;
        }
      });
    });

    socket.on("gameFinished", () => {
      router.push("/finished");
    });
    
    const start = () => {
      socket.emit("startGame", {roomCode});
    };

    const getPrompt = () => {
      socket.emit("getPrompt", {roomCode, category});
    }
    //bugging
    const sendMessage = () => {
      if (curmes.value.trim() !== "") {
        socket.emit("chatMessage", {
          roomCode,
          message: curmes.value,
          username: username.value,
        });
        curmes.value = "";
      }
    };

    socket.on("newPrompt", (prompt) => {
      gamePrompt.value = prompt;
    });

    socket.on("gameStarted", () => {
      console.log("game started!");
      gameStarted.value = true;
    });

    socket.on("chatMessage", (data) => {
      mes.value.push({
        sender: data.sender,
        text: data.message
      });
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    });
    //
    /* we might needa implement some cooldown for switching drawers*/
    socket.on("drawerChanged", (data) => {
      mes.value.push({
        sender: "System",
        text: `New drawer: ${username.value}`
        //drawer = username.value
      });
      if (data.newDrawerId === socket.id) {
        isDrawer.value = true;
        /* fix it telling you as a pop-up message*/
        getPrompt();
      } else {
        isDrawer.value = false;
      }
    });

    onBeforeUnmount(() => {
      socket.off("roomDetails");
      socket.off("chatMessage");
      socket.off("gameStarted");
      socket.off("newPrompt");
    });

    return {
      roomCode,
      players,
      start,
      gameStarted,
      isDrawer,
      getPrompt,
      mes,
      leaderboard,
      curmes,
      sendMessage,
      messageContainer,
      username,
      gamePrompt
    };
  },
});
</script>
<style>
.game-space {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.game-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.game-info {
  flex: 3;
  padding: 10px;
  overflow-y: auto;
}

.prompt-box {
  color: black;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
}

.leaderboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right : 4px solid #ccc;
  padding: 10px;
  min-width: 50px;
  max-width: 100px;
  height: 100%;
}
.leaderboard-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  border: 4px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9f9f9;
  max-height: 300px;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 4px solid #ccc;
  padding: 10px;
  min-width: 250px;
  max-width: 400px;
  height: 100%;
}

.mes-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  border: 4px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9f9f9;
  max-height: 300px;
}

.message {
  margin-bottom: 8px;
  word-wrap: break-word;
  color: #000000;
}

.system-message {
  color: #00aa00;
}

.input-container {
  display: flex;
  margin-top: 10px;
  position: sticky;
  bottom: 0;
}

.input-container input {
  flex: 1;
  padding: 8px;
  margin-right: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.input-container button {
  padding: 8px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>