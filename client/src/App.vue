<script setup lang="ts">
/*import { ref } from 'vue' */
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/vue'
/*import { useUser } from '@clerk/vue';
const { isSignedIn } = useUser(); */
</script>

<template>
  <div id="app">
    <header>
      <h1>Doodler</h1>

      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <UserButton />
        <RouterView/>
      </SignedIn>
    </header>

    <!--
    <div v-if="!isSignedIn">
      <div class="scrolling-text">
        <div class="content__container">
          <div class="content__list">
            <div class="content__list__item">Doodler</div>
            <div class="content__list__item">Drawing</div>
            <div class="content__list__item">Practice</div>
            <div class="content__list__item">Learn</div>
          </div>
        </div>
      </div>
    </div>
    -->
    

    <div class="art-space">
      <div class="paint-splatter"></div>
      <div class="paint-splatter large"></div>
      <div class="paint-splatter triangle"></div>
      <div class="paint-splatter square"></div>
      <div class="paint-splatter rectangle"></div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Bangers', cursive !important;
  font-weight: bold;
}

body, html {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vh;
  height: 100vh;
  overflow: hidden;
}

header {
  text-align: center;
  background-color: #34495e;
  color: #fff;
  padding: 50px 20px;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  width: 100%;
  flex-grow: 0;
}

h1 {
  font-size: 3.5rem;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

button {
  background: linear-gradient(45deg, #ff6ec7, #ff9a44);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
  background: linear-gradient(45deg, #ff9a44, #ff6ec7);
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

button:focus {
  outline: none;
}


.scrolling-text {
  position: absolute;
  top: 30%; 
  left: 0;
  right: 0;
  text-align: center;
}

.content__container {
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap; 
}

.content__list {
  list-style: none;
  margin-top: 0;
  padding-left: 110px;
  text-align: left;
  animation-name: scroll-left-right;
  animation-duration: 10s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  color: #ff69b4; 
  font-size: 40px; 
}

.content__list__item {
  display: inline-block;
  margin-right: 50px;
}

@keyframes scroll-left-right {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}


.art-space {
  position: relative;
  margin-top: 150px; 
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 10px;
  overflow: hidden;
}

.paint-splatter {
  position: absolute;
  background: rgba(255, 77, 122, 0.7);
  border-radius: 50%;
  opacity: 0.8;
  transform: rotate(0deg);
  animation: paint-effect 3s linear infinite;
}

.paint-splatter.large {
  width: 150px;
  height: 150px;
  left: 5%;
  top: 35%;
}

.paint-splatter.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid rgba(77, 122, 255, 0.7);
  left: 50%;
  top: 60%;
}

.paint-splatter.square {
  width: 80px;
  height: 80px;
  background-color: rgba(0, 168, 255, 0.7);
  left: 75%;
  top: 40%;
}

.paint-splatter.rectangle {
  width: 120px;
  height: 60px;
  background-color: rgba(0, 255, 77, 0.7);
  left: 20%;
  top: 70%;
}

@keyframes paint-effect {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(180deg);
  }
  50% {
    transform: translate(-40px, 40px) rotate(360deg);
  }
  75% {
    transform: translate(-50px, -20px) rotate(540deg);
  }
  100% {
    transform: translate(0, 0) rotate(720deg);
  }
}
</style>
