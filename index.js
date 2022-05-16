'use strict'

const port = process.env.PORT || 5000;

const express = require('express');
const { stat } = require('fs');
const app = express();

app.use(express.static(__dirname + '/public/'));

const server = app.listen(port, () => {
    console.log(`Juego PONG en http://localhost:${port}`);
});

// Vamos a crear un servicio tipo webSocket en lugar de webService REST

const socket = require('socket.io');
const io = socket(server);

io.sockets.on('connect', onConnect);

// Defino el estado global del juego
let connections = [];
let currentState = {
    players: [{}, {}],
    ball: {}
}


// Definimos nuestro webSocket

function onConnect(socket) {
    console.log("onConnect");

    connections.push(socket.id);

    if (connections.length > 2) {
        console.error("onConnect: Demasiados jugadores conectados");
        return;
    }

    sendCounter();

    socket.on('start', onStart);
    socket.on('updateBall', onUpdateBall);
    socket.on('updatePlayer', onUpdatePlayer);
    socket.on('disconnect', onDisconnect);

    setInterval(heartBeat, 33);
}

// Declaramos los métodos entrantes
function onStart(state) {
    consol.log('onStart');

    const index = connections[0] === state.id ? 0 : 1;
    const csp = currentState.players[index];
    csp.y = state.y;
    csp.width = state.width;
    csp.height = state.height;
    csp.score = state.score;

}


function onUpdateBall(state) {
    currentState.ball.x = state.x;
    currentState.ball.y = state.y;
    currentState.ball.speed = state.speed;
    currentState.ball.velx = state.velx;
    currentState.ball.vely = state.vely;
}

function onUpdatePlayer(state) {
    // Buscamos que jugador es a partir de su socket.id
    for (let i = 0, found = false; i < currentState.players.length && !found; i++) {
        if (currentState.players[i].id === state.id) {
            found = true;
            currentState.players[i].y = state.y;
            currentState.players[i].score = state.score;
        }
    }
}

function onDisconnect() {
    console.log("onDisconnect");

    connections = [];
    currentState = {
        players: ({}, {}),
        ball: {}
    }
}


// Declaramos métodos salientes

function sendCounter() {
    io.socket.emit('getCounter', connections.length);
}

function heartBeat() {
    io.socket.emit('heartBeat', currentState);
}