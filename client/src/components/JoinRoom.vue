<template>
    <div>
        <input v-model="roomCode" placeholder="Enter Room Code" />
        <button @click="joinRoom" :disabled="!roomCode">Join Room</button>
        <button @click="backHome">Back Home</button>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from "vue-router";
import { useSocket } from "../socket.ts"

const roomCode = ref("");
const router = useRouter();
const socket = useSocket();

const backHome = () => {
  router.push('/');
};

const joinRoom = () => {
  socket.emit("joinRoom", { roomCode: roomCode.value });
}

socket.on("joinRoomError", (data) => {
  console.log(data);
});

socket.on("joinedRoom", (data) => {
  router.push({ name: "GameRoom", params: { roomCode: data.roomCode } });
});
</script>
