<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useSocket } from "../socket.ts"; 

const socket = useSocket();
const route = useRoute();
const roomCode = route.params.roomCode as string;

// access HTML elements through refs
const canvas = ref<HTMLCanvasElement | null>(null);
const colourPicker = ref<HTMLInputElement | null>(null);
const penBtn = ref<HTMLButtonElement | null>(null);
const eraserBtn = ref<HTMLButtonElement | null>(null);
const fillBtn = ref<HTMLButtonElement | null>(null);
const clearBtn = ref<HTMLButtonElement | null>(null);
const undoBtn = ref<HTMLButtonElement | null>(null);
const redoBtn = ref<HTMLButtonElement | null>(null);
const weightSlider = ref<HTMLInputElement | null>(null);

// current tool selected by player, default is pen
let tool: string = "pen";

// canvas context - object that allows us to call methods on the canvas element
// currently set to null as the canvas element is not mounted
let ctx: CanvasRenderingContext2D | null = null;

// the weight of the current selected tool in pixels
let weight: number = 5;

// dimensions of the canvas element in pixels
const canvasWidth: number = 500;
const canvasHeight: number = 500;

// various variables relating to the state of the mouse pointer
let mouseX: number = 0;
let mouseY: number = 0;
let mouseDown: boolean = false;
// indicates the last recorded position of the mouse, while mouseX and mouseY are the current positions
let lastX: number = 0;
let lastY: number = 0;

// used the undo and redo system
// snapshots is an array containing every state of the canvas in game so far
// snapshotIndex is the index of the snapshot displayed on the drawer's canvas (usually the most recent snapshot unless they have just undone an action)
let snapshots: ArrayBuffer[] = [];
let snapshotIndex: number = 0;

// function called to send the local snapshot of the canvas to the server
// the server then broadcasts this to every player
const shareCanvas = () => {
  let imageData;
  if (ctx) {
    imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
  }
  socket.emit("canvasImageData", {roomCode, imageData});
};

// callback that displays canvas data received from the server onto the canvas
socket.on("getImageData", (data) => {
  let array = new Uint8ClampedArray(data);
  let imageData = new ImageData(array, 500);
  if (ctx) ctx.putImageData(imageData, 0, 0);
});

// callback for when the drawer changes - 
socket.on("drawerChanged", () => {
  if (!ctx) return;
  let temp = ctx.fillStyle;
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = temp;
});

// setup
onMounted(() => {
  if (!canvas.value) return;

  canvas.value.width = canvasWidth;
  canvas.value.height = canvasHeight;

  ctx = canvas.value.getContext("2d", { willReadFrequently: true });

  if (!ctx) return;

  // fill canvas with white
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // add event listeners to each button to change tool if clicked
  if (penBtn.value) penBtn.value.addEventListener("click", () => (tool = "pen"));
  if (eraserBtn.value) eraserBtn.value.addEventListener("click", () => (tool = "eraser"));
  if (fillBtn.value) fillBtn.value.addEventListener("click", () => (tool = "fill"));

  if (undoBtn.value) undoBtn.value.addEventListener("click", undo);
  if (redoBtn.value) redoBtn.value.addEventListener("click", redo);

  if (clearBtn.value) clearBtn.value.addEventListener("click", clear);

  // change colour if selected in colour picker
  if (colourPicker.value) colourPicker.value.addEventListener("input", () => {
    if (ctx) ctx.fillStyle = colourPicker.value!.value;
  });

  // change tool weight if slider moved
  if (weightSlider.value) weightSlider.value.addEventListener("input", () => {
    weight = parseInt(weightSlider.value!.value);
  });

  // add event listeners - some added to document in cases where mouse is released outside of canvas
  canvas.value.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);

  // set default colour
  ctx.fillStyle = colourPicker.value!.value;
  
  let imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
  snapshots[snapshotIndex] = imageData;
});

onBeforeUnmount(() => {
  if (!canvas.value) return;

  // remove event listeners on unmount
  canvas.value.removeEventListener("mousedown", onMouseDown);
  document.removeEventListener("mouseup", () => (mouseDown = false));
  document.removeEventListener("mousemove", onMouseMove);
});

const onMouseDown = (event: MouseEvent) => {
  if (!ctx || !canvas.value) return;

  // update mouse info
  const rect = canvas.value.getBoundingClientRect();

  mouseX = Math.round(event.clientX - rect.left);
  mouseY = Math.round(event.clientY - rect.top);
  mouseDown = true;
  lastX = mouseX;
  lastY = mouseY;

  // behaviour of each tool on mouse down
  if (tool == "pen") {
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
  }

  if (tool == "eraser") {
    let temp = ctx.fillStyle;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    ctx.fillStyle = temp;
  }

  if (tool == "fill") {
    let arr = getPixelColour(mouseX, mouseY);
    let colour = `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
    fill(mouseX, mouseY, colour);
  }
};

const onMouseUp = () => {
  if (!ctx || !canvas.value) return;

  // only update canvas when the mouse is released
  // currently this is important to prevent conflicts in the state of the canvas
  // revisit this issue later to make the canvas sync in real-time as player draws
  if (mouseDown) {
    shareCanvas();

    let imageData;
    if (ctx) {
      snapshotIndex++;
      imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
      snapshots[snapshotIndex] = imageData;
      
      let i = 1;
      while (snapshots[snapshotIndex+i]) {
        i++;
      }
      i--;
      snapshots.splice(snapshotIndex+1, i);
    }
  }
  mouseDown = false;
}

const onMouseMove = (event: MouseEvent) => {
  if (!ctx || !canvas.value) return;

  // update mouse info
  const rect = canvas.value.getBoundingClientRect();
  mouseX = Math.round(event.clientX - rect.left);
  mouseY = Math.round(event.clientY - rect.top);

  // behaviour of each tool on mouse move
  if (tool == "pen" && mouseDown) {
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    drawFrom(lastX, lastY, mouseX, mouseY);
  }
  if (tool == "eraser" && mouseDown) {
    let temp = ctx.fillStyle;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(mouseX - weight / 2, mouseY - weight / 2, weight, weight);
    drawFrom(lastX, lastY, mouseX, mouseY);
    ctx.fillStyle = temp;
  }

  // update last position of mouse
  lastX = mouseX;
  lastY = mouseY;
};

// get pixel colour at a coordinate, used for fill tool
const getPixelColour = (x: number, y: number) => {
  if (!ctx) return [255, 255, 255, 255];
  return ctx.getImageData(x, y, 1, 1).data;
};

// to draw a line between two points, used in pen tool
const drawFrom = (x1: number, y1: number, x2: number, y2: number) => {
  if (!ctx) return;

  // calculate x and y differences
  let dx = x2 - x1;
  let dy = y2 - y1;

  // take the larger of the differences as the number of steps
  let steps = Math.max(Math.abs(dx), Math.abs(dy));

  // linear interp between the two points for the number of steps, drawing a rect at each step
  for (let i = 0; i < steps; i++) {
    ctx.fillRect(
      Math.round(x1 + (dx / steps) * i - weight / 2),
      Math.round(y1 + (dy / steps) * i - weight / 2),
      weight,
      weight
    );
  }
};

// fill from point
const fill = (start_x: number, start_y: number, target_colour: string) => {
  if (!ctx) return;

  // uses breadth-first search with queue
  let queue = [[start_x, start_y]];

  // create visited array (bitmap)
  let visited = Array.from({ length: canvasHeight }, () => new Array(canvasWidth).fill(false));

  visited[start_y][start_x] = true;

  while (queue.length > 0) {
    // remove from first coord from queue and change its pixel colour
    let [x, y] = queue.shift()!;
    setPixelColour(x, y, ctx.fillStyle as string);

    // defines different directions (up, left, down, right)
    let dx = [-1, 1, 0, 0];
    let dy = [0, 0, -1, 1];

    // look in each direction
    for (let i = 0; i < dx.length; i++) {
      let nx = x + dx[i], ny = y + dy[i];
      if (
        // within bounds
        nx >= 0 && nx < canvasWidth &&
        ny >= 0 && ny < canvasHeight &&
        // not visited yet
        !visited[ny][nx]
      ) {
        // if colour is the same as the original, should be filled
        let arr = getPixelColour(nx, ny);
        let colour = `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
        if (colour === target_colour) {
          // add to queue
          queue.push([nx, ny]);
          visited[ny][nx] = true;
        }
      }
    }
  }
};
// set pixel colour, used for fill tool
const setPixelColour = (x: number, y: number, colour: string) => {
  if (!ctx) return;
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, 1, 1);
};

const undo = () => {
  if (snapshotIndex > 0) {
    snapshotIndex--;
    let array = new Uint8ClampedArray(snapshots[snapshotIndex]);
    let imageData = new ImageData(array, 500);
    if (ctx) ctx.putImageData(imageData, 0, 0);
    shareCanvas();
  }
};

const redo = () => {
  if (snapshotIndex < snapshots.length-1) {
    snapshotIndex++;
    let array = new Uint8ClampedArray(snapshots[snapshotIndex]);
    let imageData = new ImageData(array, 500);
    if (ctx) ctx.putImageData(imageData, 0, 0);
    shareCanvas();
  }
};

const clear = () => {
  if (!ctx) return;
  let temp = ctx.fillStyle;
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = temp;
  shareCanvas();

  let imageData;
  if (ctx) {
    snapshotIndex++;
    imageData = ctx.getImageData(0, 0, 500, 500).data.buffer;
    snapshots[snapshotIndex] = imageData;

    let i = 1;
    while (snapshots[snapshotIndex+i]) {
      i++;
    }
    i--;
    snapshots.splice(snapshotIndex+1, i);
  }
};
</script>

<template>
  <div>
    <canvas ref="canvas"></canvas>
    <br />
    <div>
      <input type="color" ref="colourPicker" />
      <input type="range" ref="weightSlider" min="1" max="20" value="5" />
    </div>
    <div>
      <button ref="penBtn">Pen</button>
      <button ref="eraserBtn">Eraser</button>
      <button ref="fillBtn">Fill</button>
      <button ref="clearBtn">Clear</button>
      <button ref="undoBtn">Undo</button>
      <button ref="redoBtn">Redo</button>
    </div>
  </div>
</template>

<style scoped>
canvas {
  border: 1px solid black;
  background-color: white;
}

button {
  margin: 5px;
}
</style>
