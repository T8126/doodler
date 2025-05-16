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

const playAgain = () => {
    router.push('/create')
}

    
</script>
