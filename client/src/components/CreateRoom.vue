<template>
  <div class="game-room">
    <h2>Create a Game Room</h2>
    <p>Choose a category for your game:</p>
    <select v-model="category">
      <option value="" disabled>Choose a Skill to Work On</option>
      <option value="blending">Blending</option>
      <option value="patching">Patching</option>
      <option value="stippling">Stippling</option>
    </select>
    <button @click="createGameRoom" :disabled="!category">Create Room</button>
    <button @click="backHome">Back Home</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSocket } from "../socket.ts";

const socket = useSocket();
const router = useRouter();
const category = ref('');
const error = ref('');

const backHome = () => {
  router.push('/');
};

const createGameRoom = async () => {
  if (!category.value) {
    error.value = "select a category";
    return;
  }
  console.log(category.value);
  socket.emit("createRoom", { category: category.value });

  socket.on("createdRoom", (data) => {
    socket.emit("joinRoom", {roomCode: data.roomCode});
  });

  socket.on("createRoomError", (message) => {
    error.value = message;
  });

  socket.on("joinedRoom", (data) => {
    router.push({ name: "GameRoom", params: { roomCode: data.roomCode } });
  });
};
</script>

<style scoped>
.game-room {
  padding: 20px;
  background-color: #f8f9fa;
}

h2 {
  color: #007bff;
}

.error {
  color: red;
}

select {
  margin: 10px 0;
}
</style>
