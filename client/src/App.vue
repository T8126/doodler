<script setup lang="ts">
/*import { ref } from 'vue' */
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/vue'
/*import { useUser } from '@clerk/vue';
const { isSignedIn } = useUser(); */
</script>

<template>
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
  
  <div class="art-space">
    <div class="paint-splatter"></div>
    <div class="paint-splatter large"></div>
    <div class="paint-splatter triangle"></div>
    <div class="paint-splatter square"></div>
    <div class="paint-splatter rectangle"></div>
  </div>
</template>

<style scoped>
  /* css was inspired by other works(cartoony effect, animations)*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-weight: bold;
}

body, html {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
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
 /*animation: bounce 10s linear infinite alternate;*/
}
/* u can play around with these values(%) if you want @tim*/
@keyframes large {
  0% {
    transform: rotate(0deg);
    top: 0%;
    left: 0%;
  }
  25% {
    top: 20%;
    left: calc(100% - 150px);
  }
  50% {
    top: 40%;
    left: 0%;
  }
  75% {
    top: 60%;
    left: calc(100% - 150px);
  }
  100% {
    top: 80%;
    left: 0%;
    transform: rotate(720deg);
  }
}
  
.paint-splatter.large {
  width: 150px;
  height: 150px;
  left: 5%;
  top: 35%;
  border-radius: 0%;
  animation: large 10s linear infinite alternate;
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
</style>
