const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require("cors");
const PORT = 3000;
const gameLogic = require("./game.js");
const rooms = {};

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "client", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

const generateRoomCode = () => {
  // don't inlude 0s and Os because they can be confused (or choose font in frontend where they are easily distinguishable) - same thing for 1s and ls.
  //ok yeah good point
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

io.on("connection", (socket) => {

  socket.on("createRoom", ({ category }) => {
    if (!category) {
      socket.emit("createRoomError", "no category selected");
      return;
    }

    let roomCode;

    do {
      roomCode = generateRoomCode();
    } while (rooms[roomCode]);

    rooms[roomCode] = {
      roomCode: roomCode,
      players: [],
      category: category,
      host: socket.id,
      drawerIndex: 0,
      currentPrompt: null
    };

    socket.emit("createdRoom", { roomCode });
  });

    socket.on("joinRoom", ({ roomCode }) => {
      // Should also check if player is already in a room

      const room = rooms[roomCode];

      if (!room) {
        socket.emit("joinRoomError", `room ${roomCode} does not exist`);
        return;
      }

      socket.join(roomCode);
      console.log(`Player ${socket.id} joined ${roomCode}`)

      room.players.push(socket.id);

      socket.emit("joinedRoom", { roomCode });
    });

    socket.on("getRoomDetails", ({roomCode}) => {
      const room = rooms[roomCode];

      io.to(roomCode).emit("roomDetails", {
        players: room.players, // some issue here
        category: room.category,
      });
    });

    socket.on("startGame", ({ roomCode }) => {
      // Should in future also check if the player is the host

      const room = rooms[roomCode];

      if (!room) {
        return;
      }

      if (!room.players.includes(socket.id)) {
        return;
      }

      console.log(`Room ${roomCode} started game`)

      io.to(roomCode).emit("gameStarted");
  });

  socket.on("getPrompt", ({ roomCode, category }) => {
    if (!category) {
      socket.emit("noPrompts", "no cat");
      return;
    }

    const room = rooms[roomCode];
    if (room && room.category === category) {
      const prompt = gameLogic.prompt(category);
      if (prompt) {
        // Store the current prompt in the room for guess checking
        room.currentPrompt = prompt;
        io.to(roomCode).emit("newPrompt", prompt);
      } else {
        socket.emit("noPrompts", `no ${category}`);
      }
    } else {
      socket.emit("noRoom", `no ${roomCode} `);
    }
  });

  socket.on("canvasImageData", ({ roomCode, imageData }) => {
    let room = rooms[roomCode];
    if (socket.id == room.players[room.drawerIndex]) { /* if socket request is from drawer */
      io.to(roomCode).emit("getImageData", imageData);
    }
  });
/* not needed no more
  socket.on("changeDrawer", ({ roomCode }) => {
    let room = rooms[roomCode];
    room.drawerIndex++;
    room.drawerIndex%=room.players.length;    
  });
*/
  socket.on("chatMessage", ({ roomCode, message }) => {
    const room = rooms[roomCode];
    if (room && room.players.includes(socket.id)) {
      console.log(`test: ${socket.id.substring(0, 6)}: ${message}`);
      // we using socket id as the name but later we gotta do username
      io.to(roomCode).emit("chatMessage", {
        sender: socket.id.substring(0, 6), // shortened id for display but yeah user in future
        message: message
      });

      if (room.currentPrompt && message.toLowerCase().includes(room.currentPrompt.toLowerCase())) {
        io.to(roomCode).emit("chatMessage", {
          sender: "System",
          message: `${socket.id.substring(0, 6)} guessed correctly!`
        });
        room.drawerIndex++;
        room.drawerIndex %= room.players.length;

        io.to(roomCode).emit("drawerChanged", {
          newDrawerIndex: room.drawerIndex,
          newDrawerId: room.players[room.drawerIndex]
        });

        room.currentPrompt = null;
      }
    }
  });

  socket.on("chatMessage", ({ roomCode, message }) => {
    const room = rooms[roomCode];
    if (room && room.players.includes(socket.id)) {
      console.log(`test: ${socket.id.substring(0, 6)}: ${message}`);
      // we using socket id as the name but later we gotta do username
      io.to(roomCode).emit("chatMessage", {
        sender: socket.id.substring(0, 6), // shortened id for display but yeah user in future
        message: message
      });

      if (room.currentPrompt && message.toLowerCase().includes(room.currentPrompt.toLowerCase())) {
        io.to(roomCode).emit("chatMessage", {
          sender: "System",
          message: `${socket.id.substring(0, 6)} is correct!`
        });

        room.drawerIndex++;
        room.drawerIndex %= room.players.length;

        io.to(roomCode).emit("drawerChanged", {
          newDrawerIndex: room.drawerIndex,
          newDrawerId: room.players[room.drawerIndex]
        });

        room.currentPrompt = null;
      }
    }
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (room && room.players.includes(socket.id)) {
        room.players = room.players.filter((id) => id !== socket.id);
        if (room.players.length === 0) {
          delete rooms[roomCode];
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`port ${PORT}`);
});
