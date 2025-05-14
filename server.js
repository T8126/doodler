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

// function to generate room codes
// 0s, 0s, 1s are replaced by Xs to prevent confusion
const generateRoomCode = () => {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase(); 
  const validCode = code.replace(/[0O1]/g, 'X'); 
  
  return validCode;
};

// triggers when a user connects to the website
io.on("connection", (socket) => {

  // event for users creating rooms
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
      points: {},
      category: category,
      drawerIndex: 0,
      currentPrompt: null,
      totalRounds: 3,
      currentRound: 1,
    };

    socket.emit("createdRoom", { roomCode });
  });

  // event for users joining rooms
  socket.on("joinRoom", ({ roomCode }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("joinRoomError", `room ${roomCode} does not exist`);
      return;
    }

    // different from the room object, it is a socket.io feature that allows for broadcasting
    socket.join(roomCode);

    // usernames are currently null because they are set with clerk usernames later in the 'setUser' socket callback
    room.players.push({socketId: socket.id, username: null});

    room.points[socket.id] = 0;

    console.log(`${socket.id} joined ${roomCode}`);

    socket.emit("joinedRoom", { roomCode });
  });

  // event for when players request room details before the game starts (player list, points, category, first drawer)
  socket.on("getRoomDetails", ({roomCode}) => {
    const room = rooms[roomCode];

    io.to(roomCode).emit("roomDetails", {
      players: room.players.map(players => ({
        username: players.username || players.socketId,
        points: room.points[players.socketId]
      })),
      category: room.category,
      drawerId: room.players[room.drawerIndex]?.socketId
    });
  });

  // event to start a game
  socket.on("startGame", ({ roomCode }) => {

    const room = rooms[roomCode];

    if (!room) {
      return;
    }

    if (!room.players.find(players => players.socketId === socket.id)) {
      return;
    }

    console.log(`Room ${roomCode} started the game`);

    io.to(roomCode).emit("gameStarted");
  });

  // event to generate a new prompt for a room
  socket.on("getPrompt", ({ roomCode, category }) => {
    if (!category) {
      socket.emit("noPrompts", "no category");
      return;
    }

    const room = rooms[roomCode];

    if (room && room.category === category) {
      const prompt = gameLogic.prompt(category);
      if (prompt) {
        // prompt is stored in the room to validate guesses
        room.currentPrompt = prompt;
        io.to(roomCode).emit("newPrompt", prompt);
      } else {
        socket.emit("noPrompts", `error when generating prompt`);
      }
    } else {
      socket.emit("noRoom", `no room ${roomCode} or incorrect category`);
    }
  });

  // canvas data received from the drawer which is then broadcasted to all players
  socket.on("canvasImageData", ({ roomCode, imageData }) => {
    let room = rooms[roomCode];
    if (socket.id == room.players[room.drawerIndex]?.socketId) {
      io.to(roomCode).emit("getImageData", imageData);
    }
  });

  // event to set the username for a player (based on clerk usernames)
  socket.on("setUser", ({ roomCode, username}) => {
    const room = rooms[roomCode];

    if (!room) {
      return;
    }

    const player = room.players.find(players => players.socketId === socket.id)
    if (player) {
      player.username = username;
    }

    // room details are resent to all players so that they have the most recent username info
    io.to(roomCode).emit("roomDetails", {
      players: room.players.map(players => ({
        username: players.username || players.socketId,
        points: room.points[players.socketId]
      })),
      category: room.category,
      drawerId: room.players[room.drawerIndex]?.socketId,
    })
    
  });
  
  // used for any chat messages (player and system messages), and checks for correct guesses, including drawer switching logic
  socket.on("chatMessage", ({ roomCode, message, username }) => {
    const room = rooms[roomCode];
    
    if (room && room.players.find(players => players.socketId === socket.id)) {

      io.to(roomCode).emit("chatMessage", {
        sender: username,
        message: message
      });

      console.log(`${socket.id || username}: ${message}`);

      if (room.currentPrompt && message.toLowerCase().includes(room.currentPrompt.toLowerCase()) && socket.id != room.players[room.drawerIndex].socketId) {
        console.log(`${socket.id || username} guessed prompt`);

        io.to(roomCode).emit("chatMessage", {
          sender: "System",
          message: `${username} guessed correctly!`
        });

        let drawer = room.players[room.drawerIndex];
        room.points[drawer.socketId] += 1000; // points added to drawer not guesser

        io.to(roomCode).emit("updatePoints", {
          player: drawer.username,
          points: room.points[drawer.socketId],
        });

        room.drawerIndex++;
        room.drawerIndex %= room.players.length; // modulo necessary when index increased past number of players

        if (room.drawerIndex == 0) {
          room.currentRound += 1
          if (room.currentRound > room.totalRounds) {
            io.to(roomCode).emit("gameFinished", ({ points: room.points }));
            delete rooms[roomCode];
          }
        }

        io.to(roomCode).emit("drawerChanged", {
          newDrawerIndex: room.drawerIndex,
          newDrawerId: room.players[room.drawerIndex]?.socketId,
          newDrawerName: room.players[room.drawerIndex]?.username
        });

        room.currentPrompt = null;
      }
    }
  });

  // triggers when players leave the website
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const pIndex = room.players.findIndex(players => players.socketId === socket.id);

      if (pIndex !== -1) {
        const [dc] = room.players.splice(pIndex, 1);
        io.to(roomCode).emit("chatMessage", {
          sender: "System",
          message: `${dc.username} left the room`
        });
        delete room.points[dc.socketId];
      }

      if (room.players.length === 0) {
        delete rooms[roomCode];
        }
        break;
      }
  });
});

server.listen(PORT, () => {
  console.log(`port ${PORT}`);
});
