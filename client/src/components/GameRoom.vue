<template>
  <div class="game-space">
    <div class="game-container">
      <div class="game-info">
        <h1 v-if="!gameStarted">Welcome to Room {{ roomCode }}</h1>
        <p v-if="!gameStarted">Players in this room:</p>
        <ul v-if="!gameStarted">
          <li v-for="player in players" :key="player">{{ player }}</li>
        </ul>
        <button @click="start">Start</button>
        <button @click="getPrompt">Get Prompt</button>
        <button @click="changeDrawer">Change Drawer</button>
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
import { defineComponent, onBeforeUnmount, ref, onMounted } from "vue";
import type { Ref } from 'vue';
import { useRoute } from "vue-router";
import { useSocket } from "../socket.ts";

interface Message {
  sender: string;
  text: string;
}

export default defineComponent({
  setup() {
    const route = useRoute();
    const roomCode = route.params.roomCode as string;
    const socket = useSocket();
    const gameStarted = ref(false);
    const players = ref<string[]>([]);
    let category: string;

    const mes = ref<Message[]>([]);
    const curmes = ref('');
    const messageContainer: Ref<HTMLDivElement | null> = ref(null);

    onMounted(() => {
      socket.emit("getRoomDetails", {roomCode});
    });

    socket.on("roomDetails", (data) => {
      players.value = data.players;
      category = data.category;
    });

    const start = () => {
      socket.emit("startGame", {roomCode});
    };

    const getPrompt = () => {
      socket.emit("getPrompt", {roomCode, category});
    }

    const changeDrawer = () => {
      socket.emit("changeDrawer", {roomCode});
    }

    const sendMessage = () => {
      if (curmes.value.trim() !== '') {
        socket.emit("chatMessage", {
          roomCode,
          message: curmes.value
        });
        curmes.value = '';
      }
    };

    socket.on("newPrompt", (prompt) => {
      alert(prompt);
    });

    socket.on("gameStarted", () => {
      console.log("game started!");
      gameStarted.value = true;
    });

    socket.on("chatMessage", (data) => {
      // console.log(data);
      mes.value.push({
        sender: data.sender,
        text: data.message
      });
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    });
    /* we might needa implement some cooldown for switching drawers*/
    socket.on("drawerChanged", (data) => {
      mes.value.push({
        sender: "System",
        text: `new draw ${data.newDrawerId.substring(0, 6)}`
      });
      if (data.newDrawerId === socket.id) {
        /* fix it telling you as a pop-up message*/
        getPrompt();
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
      getPrompt,
      changeDrawer,
      mes,
      curmes,
      sendMessage,
      messageContainer
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

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #ccc;
  padding: 10px;
  min-width: 250px;
  max-width: 400px;
  height: 100%;
}

.mes-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  border: 1px solid #ccc;
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
