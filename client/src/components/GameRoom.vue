<template>
  <div class="game-space">
    <div class="game-container">
      <div class="leaderboard">
        <h3>Points</h3>
        <div class="leaderboard-container">
          <div v-if="gameStarted" 
            v-for="(player, i) in leaderboard" 
            :key="i" 
            class="message">
            <strong>{{ player.username }}:</strong> {{ player.points }}
          </div>
        </div>
          
        </div>
      <div class="game-info">
        <h1 v-if="!gameStarted">Welcome to Room {{ roomCode }}</h1>
        <ul v-if="!gameStarted">
          <li v-for="player in players" :key="player">{{ player }}</li>
        </ul>
        <button @click="start" :disabled="!username" v-if="!gameStarted">Start</button>
        <button @click="getPrompt" :disabled="!username" v-if="gameStarted && isDrawer">Get New Prompt</button>
        <div v-if="gameStarted && isDrawer" class="prompt-box">Prompt: {{ gamePrompt }}</div>
        <Canvas v-if="gameStarted"></Canvas>
      </div>
      <div class="chat-container">
        <h3>Chat</h3>
        <div class="mes-container" ref="messageContainer">
          <div 
            v-for="(message, i) in mes" 
            :key="i" 
            class="message"
            :class="{ 'system-message': message.sender === 'System' }">
            <strong>{{ message.sender }}:</strong> {{ message.text }}
          </div>
        </div>
        <div class="input-container">
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
import { defineComponent, onBeforeUnmount, ref, onMounted} from "vue";
import type { Ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSocket } from "../socket.ts";
import { useUser } from '@clerk/vue';
  
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

    // refs to dynamically change values in HTML elmements
    const roomCode = route.params.roomCode as string;
    const socket = useSocket();
    const gameStarted = ref(false);
    const players = ref<string[]>([]);
    let category: string;
    const gamePrompt = ref<string | null>(null);
    const leaderboard = ref<Leaderboard[]>([]);
    const mes = ref<Message[]>([]);
    const curmes = ref("");
    const messageContainer: Ref<HTMLDivElement | null> = ref(null);
    const isDrawer = ref(false);
    const { user } = useUser();
    const username = user.value?.username
    
    // set player's username based on clerk username
    onMounted(() => {
      socket.emit("getRoomDetails", {roomCode});
      if (username) {
        socket.emit("setUser", {roomCode, username: username})
      }
    });
    
    // update leaderboard, current data, and cateogry
    socket.on("roomDetails", (data) => {
      leaderboard.value.length = 0; // clears array

      data.players.forEach((player: {username: string, points: number}) => {
        leaderboard.value.push({
          username: player.username,
          points: player.points,
        })
      });

      category = data.category;

      if (data.drawerId == socket.id) {
        isDrawer.value = true;
      } else {
        isDrawer.value = false;
      }
    });

    // update points (after drawer switch)
    socket.on("updatePoints", (data) => {
      leaderboard.value.forEach((player) => {
        if (player.username == data.player) {
          player.points = data.points;
        }
      });
    });

    // switch to end screen
    socket.on("gameFinished", () => {
      router.push("/finished");
    });
    
    // when start button is pressed (by any player)
    const start = () => {
      socket.emit("startGame", {roomCode});
      socket.emit("getPrompt", {roomCode, category});
    };

    // request a prompt by pressing Get Prompt button
    const getPrompt = () => {
      socket.emit("getPrompt", {roomCode, category});
    };

    // sending a message in chat
    const sendMessage = () => {
      if (curmes.value.trim() !== "") {
        socket.emit("chatMessage", {
          roomCode,
          message: curmes.value,
          username: username,
        });
        curmes.value = "";
      }
    };

    // receive a prompt from server after request
    socket.on("newPrompt", (prompt) => {
      gamePrompt.value = prompt;
    });

    // receive game start broadcast
    socket.on("gameStarted", () => {
      gameStarted.value = true;
    });

    // when a chat message is received
    socket.on("chatMessage", (data) => {
      mes.value.push({
        sender: data.sender,
        text: data.message
      });

      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight; // scroll to message
      }
    });

    // when drawer switches - send (local) system message and if drawer get a new prompt
    socket.on("drawerChanged", (data) => {
      mes.value.push({
        sender: "System",
        text: `New drawer: ${data.newDrawerName}`
      });

      if (data.newDrawerId === socket.id) {
        isDrawer.value = true;
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
