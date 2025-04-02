<template>
    <div>
        <h1>Game over, yay!</h1>
        <button @click="backHome">Back Home</button>
        <button @click="playAgain"> Play Again </button>
    </div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const backHome = () => {
  router.push('/');
};

// maybe we can return them to the same room, but we would probably have to remove this page then because there's no point    
const playAgain = () => {
    router.push('/create')
}

    
</script>
