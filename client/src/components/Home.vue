<script setup lang="ts">
import { useUser } from '@clerk/vue';
import { useRouter } from 'vue-router';

const { user, isSignedIn } = useUser();
const router = useRouter();

const navigateToCreateRoom = () => {
  router.push('/create');
};

const navigateToJoinRoom = () => {
  router.push('/join')
}

</script>

<template>
  <div v-if="isSignedIn">
    <h1>Welcome, {{ user?.username }}!</h1>
    <button @click="navigateToJoinRoom">Join Game Room</button>
    <button @click="navigateToCreateRoom">Create Game Room</button>
  </div>
</template>

<style scoped>
button {
  display: block;
  margin: 10px auto;
  padding: 10px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #2283f3;
}
</style>
