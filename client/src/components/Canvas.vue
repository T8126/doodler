<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useSocket } from "../socket.ts"; 

const socket = useSocket();
const route = useRoute();
const roomCode = route.params.roomCode as string;

const canvas = ref<HTMLCanvasElement | null>(null);
const colourPicker = ref<HTMLInputElement | null>(null);
const penBtn = ref<HTMLButtonElement | null>(null);
const eraserBtn = ref<HTMLButtonElement | null>(null);
const fillBtn = ref<HTMLButtonElement | null>(null);
const weightSlider = ref<HTMLInputElement | null>(null);
const shareBtn = ref<HTMLInputElement | null>(null);

let tool = "pen";
let ctx: CanvasRenderingContext2D | null = null;
let weight = 5;

const canvasWidth = 500;
const canvasHeight = 500;

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let lastX = 0;
let lastY = 0;

const shareCanvas = () => {
  let imageData;
  if (ctx) {
    imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
  }
  socket.emit("canvasImageData", {roomCode, imageData});
};

socket.on("getImageData", (data) => {
  let array = new Uint8ClampedArray(data);
  let imageData = new ImageData(array, 500);
  if (ctx) ctx.putImageData(imageData, 0, 0);
});

onMounted(() => {
  if (!canvas.value) return;

  canvas.value.width = canvasWidth;
  canvas.value.height = canvasHeight;

  ctx = canvas.value.getContext("2d", { willReadFrequently: true });

  if (!ctx) return;

  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (penBtn.value) penBtn.value.addEventListener("click", () => (tool = "pen"));
  if (eraserBtn.value) eraserBtn.value.addEventListener("click", () => (tool = "eraser"));
  if (fillBtn.value) fillBtn.value.addEventListener("click", () => (tool = "fill"));
  if (shareBtn.value) shareBtn.value.addEventListener("click", () => {
    shareCanvas();
  });

  if (colourPicker.value) colourPicker.value.addEventListener("input", () => {
    if (ctx) ctx.fillStyle = colourPicker.value!.value;
  });

  if (weightSlider.value) weightSlider.value.addEventListener("input", () => {
    weight = parseInt(weightSlider.value!.value);
  });

  canvas.value.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", () => (mouseDown = false));
  document.addEventListener("mousemove", onMouseMove);

  ctx.fillStyle = colourPicker.value!.value;
});

onBeforeUnmount(() => {
  if (!canvas.value) return;

  canvas.value.removeEventListener("mousedown", onMouseDown);
  document.removeEventListener("mouseup", () => (mouseDown = false));
  document.removeEventListener("mousemove", onMouseMove);
});

const onMouseDown = (event: MouseEvent) => {
  mouseDown = true;
  lastX = mouseX;
  lastY = mouseY;

  if (!ctx || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  mouseX = Math.round(event.clientX - rect.left);
  mouseY = Math.round(event.clientY - rect.top);

  if (tool == "pen") {
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
  }

  if (tool == "eraser") {
    let og = ctx.fillStyle;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    ctx.fillStyle = og;
  }

  if (tool == "fill") {
    let arr = getPixelColour(mouseX, mouseY);
    let colour = `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
    fill(mouseX, mouseY, colour);
  }
};

const onMouseMove = (event: MouseEvent) => {
  if (!ctx || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  mouseX = Math.round(event.clientX - rect.left);
  mouseY = Math.round(event.clientY - rect.top);

  if (tool == "pen" && mouseDown) {
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    drawFrom(lastX, lastY, mouseX, mouseY);
    lastX = mouseX;
    lastY = mouseY;
  }
  if (tool == "eraser" && mouseDown) {
    let og = ctx.fillStyle;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    drawFrom(lastX, lastY, mouseX, mouseY);
    ctx.fillStyle = og;
    lastX = mouseX;
    lastY = mouseY;
  }
};

const getPixelColour = (x: number, y: number) => {
  if (!ctx) return [255, 255, 255, 255];
  return ctx.getImageData(x, y, 1, 1).data;
};

const drawFrom = (x1: number, y1: number, x2: number, y2: number) => {
  if (!ctx) return;

  let dx = x2 - x1;
  let dy = y2 - y1;
  let steps = Math.max(Math.abs(dx), Math.abs(dy));

  for (let i = 0; i < steps; i++) {
    ctx.fillRect(
      Math.round(x1 + (dx / steps) * i - weight / 2),
      Math.round(y1 + (dy / steps) * i - weight / 2),
      weight,
      weight
    );
  }
  let imageData;
  if (ctx) {
    imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
  }
  socket.emit("canvasImageData", {roomCode, imageData});
};

const fill = (start_x: number, start_y: number, target_colour: string) => {
  if (!ctx) return;

  let queue = [[start_x, start_y]];
  let visited = Array.from({ length: canvasHeight }, () => new Array(canvasWidth).fill(false));

  visited[start_y][start_x] = true;

  while (queue.length > 0) {
    let [x, y] = queue.shift()!;
    setPixelColour(x, y, ctx.fillStyle as string);

    let dx = [-1, 1, 0, 0];
    let dy = [0, 0, -1, 1];

    for (let i = 0; i < dx.length; i++) {
      let nx = x + dx[i], ny = y + dy[i];
      if (
        nx >= 0 && nx < canvasWidth &&
        ny >= 0 && ny < canvasHeight &&
        !visited[ny][nx]
      ) {
        let arr = getPixelColour(nx, ny);
        let colour = `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
        if (colour === target_colour) {
          queue.push([nx, ny]);
          visited[ny][nx] = true;
        }
      }
    }
  }
  let imageData;
  if (ctx) {
    imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
  }
  socket.emit("canvasImageData", {roomCode, imageData});
};

const setPixelColour = (x: number, y: number, colour: string) => {
  if (!ctx) return;
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, 1, 1);
};
</script>

<template>
  <div>
    <canvas ref="canvas"></canvas>
    <br />
    <input type="color" ref="colourPicker" />
    <input type="range" ref="weightSlider" min="1" max="20" value="5" />
    <button ref="penBtn">Pen</button>
    <button ref="eraserBtn">Eraser</button>
    <button ref="fillBtn">Fill</button>
    <!--<button ref="shareBtn">Share Canvas</button> -->
  </div>
</template>

<style scoped>
canvas {
  border: 1px solid black;
  background-color: white;
}
</style>
