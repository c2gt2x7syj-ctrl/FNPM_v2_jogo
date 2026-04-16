// --- VARIÁVEIS GLOBAIS ---
let gameState = "LOGIN"; // Estados: LOGIN, START, PLAYING, GAMEOVER
let sc = 1.5; // Escala global para 1080p
let dj;
let andaresY = [];
let gameSpeed = 8;
let successfulCollections = 0;
let score = 0;

// Dados do Usuário (Leads)
let user = { nome: "", email: "" };
let inputNome, inputEmail, btnLogin;

// Assets
let imgBg, imgStart, imgEmailBox, fonteClarendon, somColisao;
let imgBons = [];
let imgRuins = [];

function preload() {
    // Carregamento da Fonte
    fonteClarendon = loadFont('Clarendon_-Regular.ttf');
    
    // Áudio
    soundFormats('mp3');
    somColisao = loadSound('caralho.mp3');

    // Imagens de Interface
    imgBg = loadImage('BG_FNPM.jpg');
    imgStart = loadImage('bg-start_screen.svg');
    imgEmailBox = loadImage('email-box.svg');
    
    // Assets de Gameplay (Bons)
    imgBons.push(loadImage('agua.png'));
    imgBons.push(loadImage('cerveja.png'));
    imgBons.push(loadImage('aconta.png'));
    imgBons.push(loadImage('toalha.png'));
    
    // Assets de Gameplay (Ruins - placeholders ou logos)
    // imgRuins.push(loadImage('...'));
}

function setup() {
    createCanvas(1920, 1080);
    imageMode(CENTER);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    textFont(fonteClarendon);

    // Define as 3 pistas (Lanes) baseadas na altura 1080p
    andaresY = [height * 0.75, height * 0.55, height * 0.35];

    setupLoginUI();
}

function draw() {
    background(20);

    if (gameState === "LOGIN") {
        drawLoginScreen();
    } else if (gameState === "START") {
        drawStartScreen();
    } else if (gameState === "PLAYING") {
        playGame();
    } else if (gameState === "GAMEOVER") {
        drawGameOver();
    }
}

// --- LÓGICA DE LOGIN & LEADS ---
function setupLoginUI() {
    // Estilização simples dos inputs via DOM
    inputNome = createInput('').attribute('placeholder', 'TEU NOME');
    inputNome.position(width/2 - 150, height/2 - 20);
    inputNome.style('width', '300px');

    inputEmail = createInput('').attribute('placeholder', 'TEU E-MAIL');
    inputEmail.position(width/2 - 150, height/2 + 40);
    inputEmail.style('width', '300px');

    btnLogin = createButton('ENTRAR NA CABINE');
    btnLogin.position(width/2 - 75, height/2 + 100);
    btnLogin.mousePressed(registerLead);
}

function registerLead() {
    if (inputNome.value() !== "" && inputEmail.value() !== "") {
        user.nome = inputNome.value();
        user.email = inputEmail.value();
        
        // Esconde os inputs para começar o jogo
        inputNome.hide();
        inputEmail.hide();
        btnLogin.hide();
        
        gameState = "START";
    } else {
        alert("Preenche os dados para libertar o som!");
    }
}

function drawLoginScreen() {
    image(imgBg, width/2, height/2, width, height);
    image(imgEmailBox, width/2, height/2, 500 * sc, 400 * sc);
    
    fill(255);
    textSize(32);
    text("REGISTA O TEU SET", width/2, height/2 - 120);
}

// --- TELA INICIAL (PÓS-LOGIN) ---
function drawStartScreen() {
    image(imgBg, width/2, height/2, width, height);
    image(imgStart, width/2, height/2, 800 * sc, 600 * sc);
    
    fill(255);
    textSize(40);
    text(`BEM-VINDO, DJ ${user.nome.toUpperCase()}`, width/2, height - 150);
    text("PRESSIONA ESPAÇO PARA DAR O PLAY", width/2, height - 100);
}

function keyPressed() {
    if (gameState === "START" && key === ' ') {
        gameState = "PLAYING";
    }
    // Lógica de movimentação do DJ (exemplo)
    if (gameState === "PLAYING") {
        if (keyCode === UP_ARROW) /* dj.subir() */;
        if (keyCode === DOWN_ARROW) /* dj.descer() */;
    }
}

// --- LÓGICA DE JOGO (ESQUELETO) ---
function playGame() {
    image(imgBg, width/2, height/2, width, height);
    
    // Aqui entrará a lógica das classes DJ, Obstacles e Collectibles
    fill(255);
    textSize(24);
    textAlign(LEFT);
    text(`PLAYER: ${user.nome}`, 50, 50);
    text(`PONTOS: ${score}`, 50, 90);
}

function drawGameOver() {
    background(0);
    fill(255);
    textSize(64);
    text("FIM DE SET", width/2, height/2);
    textSize(32);
    text(`PONTUAÇÃO DE ${user.nome}: ${score}`, width/2, height/2 + 80);
    text("PRESSIONA PARA RECOMEÇAR", width/2, height/2 + 140);
}