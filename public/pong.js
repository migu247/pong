const FONT_COLOR = `WHITE`;
const FONT_SIZE = `45px`;
const FONT_FAMILY = 'impact';
const FRAME_PER_SECOND = 50;
const COMPUTER_LVL = 0.1;
const NUM_BALLS = 5;
const BALL_COLOR = `WHITE`;
const BALL_RADIOUS = 10;
const BALL_DELTATIME = 0.5;
const BALL_VELOCIDAD = 5;
const BG_COLOR = `BLACK`;
const PADDLE_RIGHT_COLOR = `WHITE`;
const PADDLE_LEFT_COLOR = `WHITE`;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const NET_COLOR = `WHITE`;
const NET_WIDTH = 4;
const NET_HEIGHT = 10;
const NET_PADDING = 15;


// recuperamos el canvas
const cvs = document.getElementById("pong_canvas");
const ctx = cvs.getContext("2d");

//Objetos

const playerA = {
    x: 0,
    y: cvs.height / 2 - PADDLE_HEIGHT / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    color: PADDLE_LEFT_COLOR,
    score: 0
}

const playerB = {
    x: cvs.width - PADDLE_WIDTH,
    y: cvs.height / 2 - PADDLE_HEIGHT / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    color: PADDLE_RIGHT_COLOR,
    score: 0
}

const ball = {
    x: cvs.width / 2,
    y: cvs.height / 2,
    radius: BALL_RADIOUS,
    speed: BALL_VELOCIDAD,
    velx: BALL_VELOCIDAD,
    vely: BALL_VELOCIDAD,
    color: BALL_COLOR
}

const Net = {
    x: cvs.width / 2 - NET_WIDTH / 2,
    y: 0,
    w: NET_WIDTH,
    h: NET_HEIGHT,
    padding: NET_PADDING,
    color: NET_COLOR
}

const paddle = {
    x: cvs.width / 2 - NET_WIDTH / 2,
    y: 0,
    w: NET_WIDTH,
    h: NET_HEIGHT,
    padding: NET_PADDING,
    color: NET_COLOR
}

let localPlayer;
let remotePlayer;

//SOCKET helpers ..................................

const WEBSOCKET_SERVER = `http://localhost:5000`;
const LOCAL_PLAYER_COLOR = 'RED';

let socket;
let localPlayerIndx;
let remotePlayerIndx;


function sendBallStatus() {
    const ballStatus = {
        x: ball.x,
        y: ball.y,
        speed: ball.speed,
        velx: ball.velx,
        vely: ball.vely
    }

    socket.emit('updateBall', ballStatus);
}

function sendLocalPlayerStatus(canal = 'updatePlayer') {
    const localPlayerStatus = {
        id: localPlayer.id,
        y: localPlayer.y,
        width: localPlayer.width,
        height: localPlayer.height
    }

    socket.emit(canal, localPlayerStatus)
}

function sendUpdateScore(scoreIndx) {
    socket.emit('updateScore', scoreIndx);
}

//Eventos entrantes

function onHeartBeat(state) {
    //Actualizamos estado del remoto
    remotePlayer.y = state.players[remotePlayerIndx].y;

    //Actualizamos el stado de la pelota

    ball.x = state.ball.x;
    ball.y = state.ball.y;
    ball.speed = state.ball.speed;
    ball.velx = state.ball.velx;
    ball.vely = state.ball.vely;
}

function onUpdateScore(scoreIndx) {

    if (scoreIndx === 1 && localPlayer.x === 0 || scoreIndx === 0 && localPlayer.x !== 0) {

        newBall();


    }

    scoreIndx === 0 ? playerA.score++ : playerB.score++;

}

function setPlayers(serverCounter) {

    function registerPlayer(local, remote, localIndx, remoteIndx) {
        localPlayer = local;
        remotePlayer = remote;
        localPlayerIndx = localIndx;
        remotePlayerIndx = remoteIndx;

        localPlayer.id = socket.id;
        localPlayer.color = LOCAL_PLAYER_COLOR;
        localPlayer.y = cvs.height / 2 - localPlayer.height / 2;
        localPlayer.score = 0;

        sendLocalPlayerStatus('start');
    }

    switch (serverCounter) {
        case 1:
            registerPlayer(playerA, playerB, 0, 1);
            drawText('Esperando rival...', cvs.width / 4, cvs.height / 2, 'GREEN');
            break;
        case 2:
            if (playerA.id === undefined) {
                registerPlayer(playerB, playerA, 1, 0);
            }
            //Ambos jugadres harán lo siguiente
            console.log("Comenzamos el juego");
            newBall();
            sendBallStatus();
            socket.on('heartBeat', onHeartBeat);
            initLoopGame();
    }

}

//Iniciamos la conexion

function initServerConnection() {
    socket = io.connect(WEBSOCKET_SERVER);

    socket.on('getCounter', setPlayers);
    socket.on('updateScore', onUpdateScore);
}


//Helpers 

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function drawText(text, x, y, color = FONT_COLOR, font_size = FONT_SIZE, font_family = FONT_FAMILY) {
    ctx.fillStyle = color;
    ctx.font = `${font_size} ${font_family}`;
    ctx.fillText(text, x, y);
}

// Helpers del PONG

function drawBoard() {
    clearCanvas();
    drawNet();
    drawPaddle(playerA);
    drawPaddle(playerB);

}

function clearCanvas() {
    drawRect(0, 0, cvs.width, cvs.height, BG_COLOR);
}


function drawNet() {
    for (let i = 0; i < cvs.height; i += NET_PADDING) {
        drawRect(Net.x, Net.y + i, Net.w, Net.h, Net.color);
    }
}

function drawScore() {
    drawText(localPlayer.score, (localPlayer.x === 0 ? 1 : 3) * (cvs.width / 4), cvs.height / 5);
    drawText(remotePlayer.score, (remotePlayer.x === 0 ? 1 : 3) * (cvs.width / 4), cvs.height / 5);
}

function drawPaddle(paddle) {
    drawRect(paddle.x, paddle.y, paddle.w, paddle.h, paddle.color)
}

function drawBall() {
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function render() {
    clearCanvas();
    drawNet();
    drawScore();
    drawBall();
    drawPaddle(localPlayer);
    drawPaddle(remotePlayer);

    if (isGameOver()) {
        endGame();
    } else {
        drawBall();
    }
}

function isGameOver() {
    console.log("derrota")
    return localPlayer.score >= NUM_BALLS || remotePlayer.score >= NUM_BALLS;
}

function endGame() {

    drawText('GAME OVER', cvs.width / 3, cvs.height / 2, 'BLUE');

    stopGameLoop();
    sendBallStatus();
    sendLocalPlayerStatus();

    setTimeout(() => {
        socket.disconnect();
    }, 100);

}

function initPaddleMovement() {
    cvs.addEventListener('mousemove', updateLocalPlayerPos);
}

function updateLocalPlayerPos(event) {
    const rect = cvs.getBoundingClientRect();
    localPlayer.y = event.clientY - localPlayer.h / 2 - rect.top;

}

function pause(ms) {
    stopGameLoop();
    setTimeout(() => {
        initLoopGame();
    }, ms);


}

function collision(b, p) {

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.h;
    p.left = p.x;
    p.right = p.x + p.w;

    return b.right > p.left && b.bottom > p.top && b.top < p.bottom && b.left < p.right
}

function update() {
    console.log("actualizando...");
    ball.x += ball.velx;
    ball.y += ball.vely;

    //actualizamos la IA

    //updateComputer();

    //si golpea bordes

    if (ball.y + ball.radius > cvs.height || ball.y - ball.radius < 0) {
        ball.vely = -ball.vely;
    }

    let whatPlayer = (ball.x < cvs.width / 2) ? playerA : playerB;
    if (collision(ball, whatPlayer)) {
        let colliderPoint = ball.y - (whatPlayer.y + whatPlayer.h / 2);
        colliderPoint = colliderPoint / (whatPlayer.h / 2);
        const anglePad = colliderPoint * Math.PI / 4;

        const direccion = (ball.x < cvs.width / 2) ? 1 : -1;

        ball.velx = direccion * ball.speed * Math.cos(anglePad);
        ball.vely = ball.speed * Math.sin(anglePad);

        ball.speed += BALL_DELTATIME;
    }

    if (ball.x - ball.radius < 0) {
        if (localPlayerIndx === 1) {
            newBall();
            sendBallStatus();
            sendUpdateScore(localPlayer);
        }

    } else if (ball.x + ball.radius > cvs.width) {
        if (localPlayerIndx === 0) {
            newBall();
            sendBallStatus();
            sendUpdateScore(localPlayer);
        }
    }

    sendLocalPlayerStatus();
    sendBallStatus();

}

function newBall() {
    ball.x = cvs.width / 2;
    ball.y = cvs.height / 2;
    const direccion = ball.velx > 0 ? -1 : 1;
    ball.velx = direccion * BALL_VELOCIDAD;
    ball.vely = BALL_VELOCIDAD;
    ball.speed = BALL_VELOCIDAD;



}


function loopGame() {
    update();
    render();
}

let gameLoopId;

function stopGameLoop() {
    clearInterval(gameLoopId);
}


function initLoopGame() {
    gameLoopId = setInterval(loopGame, 1000 / FRAME_PER_SECOND);
}

function play() {
    drawBoard();
    initServerConnection();
    initPaddleMovement();
}

play();