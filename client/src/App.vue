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
  /* ChatGPT was used in the creation of this css with fixing issues*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Bangers', cursive !important;
  font-weight: bold;
}

body, html {
  background: repeating-radial-gradient(
    circle at random(100%) random (100%),
    #ff6ec7 0,
    #ff6ec7 5px,
    transparent 5px,
    transparent 10px,
  );
  
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  /* find some svg for more cartoony background for later, ask george what he would like*/
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

header {
  text-align: center;
  background-color: #34495e;
  color: #fff;
  padding: 50px 20px;
  border: 4px solid #000;
  border-radius: 20px;
  box-shadow: 5px 5px 0px #000;
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
  background: #ffdf00;
  padding: 15px 30px;
  border: 4px solid #000;
  box-shadow: 2px 2px 0px #000;
  border-radius: 15px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
  background: linear-gradient(45deg, #ff9a44, #ff6ec7);
  background-color: #ffe066;
  transform: scale(1.1);
  box-shadow: 3px 3px 0px #000;
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.paint-splatter {
  position: absolute;
  background: rgba(255, 77, 122, 0.7);
  border-radius: 50%;
  animation: bounce 10s linear infinite alternate;
}
/* u can play around with these values(%) if you want @tim*/
@keyframes bounce {
  0% {
    transform: translate(0, 0) rotate (0deg);
    top: 10%;
    left: 10%;
  }
  25% {
    top: 20%;
    left: 70%;
  }
  50% {
    top: 80%;
    left: 60%;
  }
  75% {
    top: 50%;
    left: 20%;
  }
  100% {
    top: 30%;
    left: 90%;
    transform: rotate(720deg);
  }
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
/* useless now, if we want to revert back to this it is always here*/
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
