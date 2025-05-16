# Doodler Drawing App

Grade 12 Computer Science Project

## Description

Doodler is a multiplayer art game that aims for users to improve their art skills. Users can create game rooms to share with their friends and choose specific art skills they want to work on. This game is more collaborative, not competitive, where you want the other player to be able to guess your drawing. 

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contact Info](#contacts)

## Installation

1. Clone the repository:

   go to your shell and type: git clone https://github.com/T8126/doodler.git

2. Navigate to the project directory:
   
   cd doodler

3. Install dependencies:

   npm install
   
   cd client -> npm install
   
4. Get a Clerk API Key:

   Create a file in the client folder called .env.local

   In this file, write: VITE_CLERK_PUBLISHABLE_KEY= (key)

6. Start the app:

   cd client -> npm run start (or npm run build if testing)
   
   cd .. -> node server.js
   

7. Now that it is running, visit http://localhost:3000 in your browser

## Usage
To use Doodler, you must sign up using clerk authentication. After an account is created, you can either create a game room or join a game room. If creating, you must select a skill you want to work on then create it. This will generate a unique alphanumeric code for you to give to the other players that want to join. Once the players have joined, you can press start, and the game will be started. The drawer is given a prompt and the guesser must guess that prompt, where they will guess in the chat. If the guesser guesses the prompt correctly, a new drawer is chosen and points are awarded.

Summary:
1. Open the app and create an account/login
2. Create A Game Room(or join if you are not the host)
3. Press Start
4. Guesser must guess the prompt in chat and if correct, new drawer is chosen

## Contributing
Permission is given to fork this repository and contribute to the project. Here is how:

1. Fork the repository
2. Create a new branch(git checkout -b feature-branch)
3. Commit the changes (git commit -am 'Feature')
4. Push to the new branch (git push origin feature-branch)
5. Create a new pull request

## Contacts

React out to:
- pydjeon / surya.suthakar@gmail.com
- t8126 / timothyriddolls@gmail.com
