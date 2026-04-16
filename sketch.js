// ============================================================
//  FNPM v2 — OCP Sets | p5.js  (espaco logico 1920x1080)
//  Fluxo: START → TV_TRANSITION → LOGIN → TV_TRANSITION2 → LOADING → LOADING_BAR → PLAYING → RANKING
// ============================================================

const LW = 1920, LH = 1080;
let ratio = 1, ox = 0, oy = 0;

// 8 estados de jogo
let gameState = "START";
let currentUser = { nome: "", email: "" };

// Assets
let imgBg, imgBgAzul, imgStart, imgLogoBox, imgTvFlores;
let imgNameBox, imgEmailBox, imgPlayBox;
let imgDJ, imgCursor, imgMusica;
let djChars = [];
let djSizes = [];
let imgBons = [];
let imgBtnR, imgBtnEsc;
let imgSimboloVida;
let imgCimaSeta, imgBaixoSeta, imgDireitaSeta;
let imgFundoLoading;
let imgLoginScreen;
let imgRankingBg;
let fonteClarendon, somTrilha, somGameplay, somColeta;
let sonsColisao = [];

// Estado do jogo
let dj;
let obstacles    = [];
let collectibles = [];
let andaresY     = [];
let gameSpeed    = 10;
let score        = 0;
let vidas        = 2;
let successfulCollections = 0;
let spawnTimer    = 0;
let spawnInterval = 40;
let cursorX       = 0;

// DOM
let inputNome, inputEmail, btnPlay;
let flashError = false;
let flashErrorMsg = '';
let tvTransitionFrame = 0;
let tvTransitionDuration = 40;
let tvTransition2Frame = 0;
let loadingBarFrame = 0;
let loadingBarDuration = 300; // 5 seconds at 60fps
let _top5Cache = [];

// ── PRELOAD ──────────────────────────────────────────────────
function preload() {
  fonteClarendon = loadFont('Clarendon_-Regular.ttf');
  soundFormats('mp3', 'wav');
  somTrilha   = loadSound('trilha_jogo.wav');
  somGameplay = loadSound('trilha_gameplay.wav');
  somColeta   = loadSound('pedidos_coleta.mp3');
  sonsColisao.push(loadSound('musica_nao.mp3'));
  sonsColisao.push(loadSound('karalhooo.mp3'));
  sonsColisao.push(loadSound('ai_caralho.mp3'));

  imgBg       = loadImage('BG_FNPM.png');
  imgBgAzul   = loadImage('bg-azul-f.png');
  imgStart    = loadImage('bg-start_screen.svg');
  imgLogoBox  = loadImage('logo-box.svg');
  imgTvFlores = loadImage('tv_flores.png');
  imgNameBox  = loadImage('_name-box.svg');
  imgEmailBox = loadImage('_email-box.svg');
  imgPlayBox  = loadImage('play-box.svg');
  imgDJ       = loadImage('dedo_pixel_strong.png');
  djChars.push(loadImage('dedo_pixel_strong.png'));
  djChars.push(loadImage('cara_pixel.png'));
  djChars.push(loadImage('pixel_art_less.png'));
  djChars.push(loadImage('pixel_art.png'));
  // Proporções reais: h=180, w proporcional
  djSizes.push({w: 83, h: 180});   // dedo
  djSizes.push({w: 180, h: 180});  // cara
  djSizes.push({w: 166, h: 180});  // cora
  djSizes.push({w: 140, h: 180});  // cabeca-ocp
  imgCursor   = loadImage('cursor.png');
  imgMusica   = loadImage('musica-obstacle.png');

  imgBons.push(loadImage('agua-order.png'));
  imgBons.push(loadImage('aconta-order.png'));
  imgBons.push(loadImage('cerveja-order.png'));
  imgBons.push(loadImage('toalha-order.png'));

  imgBtnR   = loadImage('R-botao.svg');
  imgBtnEsc = loadImage('esc-botao.svg');

  imgSimboloVida = loadImage('simbolo_vida.svg');

  imgCimaSeta = loadImage('cima_seta.svg');
  imgBaixoSeta = loadImage('baixo-seta.svg');
  imgDireitaSeta = loadImage('direita-seta.svg');

  imgFundoLoading = loadImage('Fundo_loading-screen.png');

  imgLoginScreen  = loadImage('login_screen.png');
  imgRankingBg    = loadImage('rankingbg_screen.png');
}

// ── SETUP ────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());
  calcRatio();
  imageMode(CENTER);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont(fonteClarendon);
  // Pixelizar personagens
  for (var i = 0; i < djChars.length; i++) {
    djChars[i] = pixelate(djChars[i], 6);
  }
  // Pistas — extraídas das posições do dedo e da cerveja no Sketch Game_screen
  andaresY = [LH * 0.823, LH * 0.535, LH * 0.246];
  setupLoginUI();
}

function pixelate(img, res) {
  var g = createGraphics(res, res);
  g.pixelDensity(1);
  g.image(img, 0, 0, res, res);
  var out = g.get();
  g.remove();
  return out;
}

function calcRatio() {
  ratio = min(windowWidth / LW, windowHeight / LH);
  ox    = (windowWidth  - LW * ratio) / 2;
  oy    = (windowHeight - LH * ratio) / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calcRatio();
  repositionUI();
}

// Converte coords logicas -> pixels reais do ecra
function lx(x) { return ox + x * ratio; }
function ly(y) { return oy + y * ratio; }

// ── LOGIN UI (DOM) ────────────────────────────────────────────
function setupLoginUI() {
  inputEmail = createInput('');
  inputEmail.attribute('placeholder', 'EMAIL');

  inputNome = createInput('');
  inputNome.attribute('placeholder', 'NOME');

  btnPlay = createButton('');
  btnPlay.mousePressed(registerLead);

  styleInputs();
  repositionUI();
  hideLoginUI(); // escondido no início — aparece após o START screen
}

function styleInputs() {
  var fs = floor(22 * ratio) + 'px';
  [inputEmail, inputNome].forEach(function(inp) {
    inp.style('background',     'transparent');
    inp.style('border',         'none');
    inp.style('color',          '#4A1504');
    inp.style('text-align',     'center');
    inp.style('font-family',    'Clarendon, serif');
    inp.style('font-size',      fs);
    inp.style('letter-spacing', '2px');
    inp.style('outline',        'none');
    inp.style('box-shadow',     'none');
    inp.style('padding',        '0');
  });
  btnPlay.style('background', 'transparent');
  btnPlay.style('border',     'none');
  btnPlay.style('cursor',     'pointer');
  btnPlay.style('outline',    'none');
}

function repositionUI() {
  if (!inputNome) return;
  var fw = floor(608 * ratio), fh = floor(63 * ratio);
  var bw = floor(109 * ratio), bh = floor(77 * ratio);

  inputNome.size(fw, fh);
  inputNome.position(lx(657), ly(610));

  inputEmail.size(fw, fh);
  inputEmail.position(lx(657), ly(710));

  btnPlay.size(bw, bh);
  btnPlay.position(lx(1156), ly(810));

  styleInputs();
}

function hideLoginUI() { inputNome.hide(); inputEmail.hide(); btnPlay.hide(); }
function showLoginUI()  { inputNome.show(); inputEmail.show(); btnPlay.show(); }

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function registerLead() {
  var nome  = inputNome.value().trim();
  var email = inputEmail.value().trim();

  if (nome === '' || email === '') {
    flashErrorMsg = 'Preenche nome e e-mail para entrar!';
    flashError = true;
    setTimeout(function() { flashError = false; }, 2000);
    return;
  }

  if (!isValidEmail(email)) {
    flashErrorMsg = 'POR FAVOR, INSIRA UM E-MAIL VÁLIDO PARA ENTRAR NA CABINE';
    flashError = true;
    inputEmail.style('border', '2px solid red');
    setTimeout(function() {
      flashError = false;
      inputEmail.style('border', 'none');
    }, 2500);
    return;
  }

  currentUser.nome  = nome;
  currentUser.email = email;

  // Enviar lead para API Vercel (proxy para Google Sheets)
  fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome, email: email })
  }).catch(function() {});

  hideLoginUI();
  tvTransition2Frame = 0;
  gameState = "TV_TRANSITION2";
}

// ── DRAW LOOP ─────────────────────────────────────────────────
function draw() {
  background(10);
  push();
    translate(ox, oy);
    scale(ratio);
    if      (gameState === "START")          drawStart();
    else if (gameState === "TV_TRANSITION")   drawTvTransition();
    else if (gameState === "LOGIN")           drawLogin();
    else if (gameState === "TV_TRANSITION2")  drawTvTransition2();
    else if (gameState === "LOADING")         drawLoading();
    else if (gameState === "LOADING_BAR")     drawLoadingBar();
    else if (gameState === "PLAYING")         playGame();
    else if (gameState === "RANKING")         drawRankingScreen();
  pop();
}

// ── TELAS ─────────────────────────────────────────────────────

// START SCREEN
function drawStart() {
  // Iniciar trilha se ainda não estiver tocando
  if (!somTrilha.isPlaying()) {
    somTrilha.setVolume(0.4);
    somTrilha.loop();
  }
  image(imgBgAzul, 935, 540, 1970, 1448);
  image(imgLogoBox, 935, 337, 908, 462);
  image(imgTvFlores, 936, 800, 1130, 870);
  fill(255, 240, 172);
  noStroke();
  textSize(28);
  // Desenhar frase em partes para colorir ESPAÇO
  var parte1 = 'Pressione "';
  var parte2 = 'ESPAÇO';
  var parte3 = '" para ';
  var totalW = textWidth(parte1 + parte2 + parte3);
  var startX = 935 - totalW / 2;
  textAlign(LEFT, CENTER);
  fill(255, 240, 172);
  text(parte1, startX, 40);
  fill(255, 240, 172);
  text(parte2, startX + textWidth(parte1), 40);
  fill(255, 240, 172);
  text(parte3, startX + textWidth(parte1 + parte2), 40);
  // COMEÇAR piscando
  if (floor(frameCount / 30) % 2 === 0) {
    fill(211, 73, 13);
  } else {
    fill(211, 73, 13, 0);
  }
  text("COMEÇAR", startX + totalW, 40);
  textAlign(CENTER, CENTER);
}

// TV TURN-ON TRANSITION (flash de câmera)
function drawTvTransition() {
  var t = tvTransitionFrame / tvTransitionDuration; // 0 → 1
  tvTransitionFrame++;

  if (t < 0.25) {
    // Fase 1: flash branco intenso sobre a tela start
    drawStart();
    var flashAlpha = map(t, 0, 0.25, 100, 255);
    var flicker = random(200, 255);
    fill(flicker, flicker, flicker, flashAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else if (t < 0.5) {
    // Fase 2: branco total com linha de estática (scanlines)
    fill(255);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
    for (var s = 0; s < 30; s++) {
      var sy = random(LH);
      fill(random(180, 240), random(180, 240), random(180, 240), random(60, 150));
      rect(LW / 2, sy, LW, random(1, 4));
    }
  } else if (t < 0.75) {
    // Fase 3: login aparece com flash branco forte por cima
    drawLogin();
    var fadeAlpha = map(t, 0.5, 0.75, 240, 80);
    fill(255, 255, 255, fadeAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else if (t < 1.0) {
    // Fase 4: flash branco termina de sumir
    drawLogin();
    var fadeAlpha = map(t, 0.75, 1.0, 80, 0);
    fill(255, 255, 255, fadeAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else {
    // Transição completa
    showLoginUI();
    gameState = "LOGIN";
  }
}

// LOGIN SCREEN
function drawLogin() {
  image(imgLoginScreen, LW / 2, LH / 2, LW, LH);
  image(imgLogoBox, 963, 418, 608, 315);
  image(imgNameBox,  961, 642, 613, 68);
  image(imgEmailBox, 961, 742, 613, 68);
  image(imgPlayBox, 1211, 849, 114, 82);
  if (flashError) {
    fill(255, 50, 50, 220);
    noStroke();
    textSize(18);
    text(flashErrorMsg, LW / 2, 580);
  }
}

// TV TURN-ON TRANSITION 2 (LOGIN → LOADING)
function drawTvTransition2() {
  var t = tvTransition2Frame / tvTransitionDuration;
  tvTransition2Frame++;

  if (t < 0.25) {
    drawLogin();
    var flashAlpha = map(t, 0, 0.25, 100, 255);
    var flicker = random(200, 255);
    fill(flicker, flicker, flicker, flashAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else if (t < 0.5) {
    fill(255);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
    for (var s = 0; s < 30; s++) {
      var sy = random(LH);
      fill(random(180, 240), random(180, 240), random(180, 240), random(60, 150));
      rect(LW / 2, sy, LW, random(1, 4));
    }
  } else if (t < 0.75) {
    drawLoading();
    var fadeAlpha = map(t, 0.5, 0.75, 240, 80);
    fill(255, 255, 255, fadeAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else if (t < 1.0) {
    drawLoading();
    var fadeAlpha = map(t, 0.75, 1.0, 80, 0);
    fill(255, 255, 255, fadeAlpha);
    noStroke();
    rect(LW / 2, LH / 2, LW, LH);
  } else {
    gameState = "LOADING";
  }
}

// LOADING BAR (LOADING → PLAYING)
function drawLoadingBar() {
  image(imgFundoLoading, LW / 2, LH / 2, LW, LH);

  loadingBarFrame++;
  var progress = min(loadingBarFrame / loadingBarDuration, 1.0);
  var pct = floor(progress * 100);

  // Retângulo creme externo
  var barX = LW / 2;
  var barY = LH / 2;
  var barW = 600;
  var barH = 60;
  fill(255, 240, 172);
  stroke(211, 73, 13);
  strokeWeight(3);
  rect(barX, barY, barW, barH);

  // Barra verde de progresso
  var greenW = (barW - 10) * progress;
  if (greenW > 0) {
    fill(73, 205, 87);
    noStroke();
    rect(barX - (barW - 10) / 2 + greenW / 2, barY, greenW, barH - 10);
  }

  // Texto porcentagem dentro da barra
  fill(80, 30, 5);
  noStroke();
  textSize(24);
  textAlign(CENTER, CENTER);
  text(pct + "%", barX, barY);

  // Texto "CARREGANDO" com reticências animadas
  var dots = floor((frameCount / 15) % 4);
  var dotsStr = "";
  for (var d = 0; d < dots; d++) dotsStr += ".";
  fill(80, 30, 5);
  textSize(28);
  text("CARREGANDO" + dotsStr, barX, barY + 55);

  // Quando completo, inicia o jogo
  if (progress >= 1.0) {
    somTrilha.stop();
    initGame();
    somGameplay.setVolume(0.4);
    somGameplay.loop();
    gameState = "PLAYING";
  }
}

// LOADING / INSTRUÇÕES
function drawLoading() {
  image(imgFundoLoading, LW / 2, LH / 2, LW, LH);

  // Logo com borda laranja piscando
  var pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 80, 255);
  stroke(255, 140, 0, pulseAlpha);
  strokeWeight(5);
  noFill();
  rect(963, 418, 612, 319);
  noStroke();
  image(imgLogoBox, 963, 418, 608, 315);

  // Botão ↑ e ↓
  fill(50, 190, 70); stroke(237, 0, 140, pulseAlpha); strokeWeight(4);
  rect(718, 659, 110, 77);
  noStroke();
  image(imgCimaSeta, 718, 659, 18, 50);

  fill(50, 190, 70); stroke(237, 0, 140, pulseAlpha); strokeWeight(4);
  rect(843, 659, 110, 77);
  noStroke();
  image(imgBaixoSeta, 843, 659, 18, 50);

  // Botão →
  fill(50, 190, 70); stroke(237, 0, 140, pulseAlpha); strokeWeight(4);
  rect(718, 751, 110, 77);
  noStroke();
  image(imgDireitaSeta, 718, 751, 50, 18);

  // Ícone vidas com borda piscante
  stroke(255, 140, 0, pulseAlpha);
  strokeWeight(4);
  noFill();
  rect(718, 835, 113, 65);
  noStroke();
  image(imgSimboloVida, 718, 835, 109, 61);

  // Textos de instrução
  fill(80, 30, 5); noStroke();
  textAlign(LEFT, TOP);
  textSize(19);
  text("Use CIMA e BAIXO para desviar dos pedidos\nindesejados e coletar os outros.", 934, 635);
  text("Use DIREITA para acelerar.",                                                934, 736);
  text("São as tuas 2 vidas. Quando uma vida\nfor perdida a luz VERMELHA apagará.",  934, 806);

  textAlign(CENTER, CENTER);
  fill(80, 30, 5);
  textSize(26);
  text("PRESSIONA  ESPAÇO  PARA  COMEÇAR", LW / 2, LH - 58);
}

// ── GAMEPLAY ──────────────────────────────────────────────────
function initGame() {
  dj = new DJ();
  obstacles    = [];
  collectibles = [];
  score        = 0;
  vidas        = 2;
  successfulCollections = 0;
  gameSpeed     = 10;
  spawnInterval = 40;
  spawnTimer    = 0;
  cursorX       = 0;
}

function playGame() {
  image(imgBg, LW / 2, LH / 2, LW, LH);

  // Seta direita = boost de velocidade
  var boost = keyIsDown(RIGHT_ARROW) ? 4 : 0;

  cursorX += (gameSpeed + boost) * 1.4;
  if (cursorX > LW + 60) cursorX = -60;
  tint(255, 55);
  image(imgCursor, cursorX, LH / 2, 34, LH);
  noTint();

  dj.update();
  dj.show();

  for (var i = collectibles.length - 1; i >= 0; i--) {
    collectibles[i].update(boost);
    collectibles[i].show();
    if (collectibles[i].hits(dj)) {
      // Som curto rítmico na coleta
      try { somColeta.rate(1.0); somColeta.play(0, 1.0, 0.35, 0, 0.08); } catch(e) {}
      score += 10;
      successfulCollections++;
      collectibles.splice(i, 1);
      dj.grow();
      levelUp();
    } else if (collectibles[i].offScreen()) {
      collectibles.splice(i, 1);
    }
  }

  for (var j = obstacles.length - 1; j >= 0; j--) {
    obstacles[j].update(boost);
    obstacles[j].show();
    if (obstacles[j].hits(dj)) {
      try { var sc = random(sonsColisao); sc.rate(1.5); sc.play(); } catch(e) {}
      score = max(0, score - 15);
      dj.resetChar();
      vidas--;
      obstacles.splice(j, 1);
      if (vidas <= 0) { triggerGameOver(); return; }
    } else if (obstacles[j].offScreen()) {
      obstacles.splice(j, 1);
    }
  }

  spawnTimer++;
  if (spawnTimer >= spawnInterval) { spawnTimer = 0; spawnObject(); }

  // HUD — vidas
  fill(242, 240, 206); stroke(200, 120, 40); strokeWeight(2);
  rect(78.5, 61.5, 109, 61, 4);
  noStroke();
  fill(vidas >= 1 ? color(255, 50, 30) : color(60, 40, 40));
  ellipse(53, 62, 18, 18);
  fill(vidas >= 2 ? color(255, 50, 30) : color(60, 40, 40));
  ellipse(106, 62, 18, 18);

  // HUD — pontos
  fill(242, 240, 206); stroke(200, 120, 40); strokeWeight(2);
  rect(316.5, 61.5, 333, 61, 4);
  noStroke();
  fill(80, 30, 5);
  textAlign(LEFT, CENTER);
  textSize(22);
  text("PONTOS: " + score, 179, 61.5);
  textAlign(CENTER, CENTER);
}

function spawnObject() {
  var lane = floor(random(andaresY.length));
  if (random() < 0.5) obstacles.push(new Obstacle(lane));
  else                  collectibles.push(new Collectible(lane));
}

function levelUp() {
  if (successfulCollections > 0 && successfulCollections % 5 === 0) {
    gameSpeed     = min(gameSpeed + 1.5, 22);
    spawnInterval = max(spawnInterval - 4, 18);
  }
}

// ── CLASSES ───────────────────────────────────────────────────
class DJ {
  constructor() {
    this.lane    = 1;
    this.x       = 138;
    this.y       = andaresY[1];
    this.targetY = this.y;
    this.charIdx = 0;
    this.img     = djChars[0];
    this.w       = djSizes[0].w;
    this.h       = djSizes[0].h;
  }
  subir()  { if (this.lane > 0)                   { this.lane--; this.targetY = andaresY[this.lane]; } }
  descer() { if (this.lane < andaresY.length - 1)  { this.lane++; this.targetY = andaresY[this.lane]; } }
  grow()   {
    // Avança para o próximo personagem se houver
    if (this.charIdx < djChars.length - 1) {
      this.charIdx++;
      this.img = djChars[this.charIdx];
      this.w   = djSizes[this.charIdx].w;
      this.h   = djSizes[this.charIdx].h;
    }
  }
  resetChar() {
    this.charIdx = 0;
    this.img     = djChars[0];
    this.w       = djSizes[0].w;
    this.h       = djSizes[0].h;
  }
  update() { this.y = lerp(this.y, this.targetY, 0.14); }
  show()   {
    drawingContext.imageSmoothingEnabled = false;
    image(this.img, this.x, this.y, this.w, this.h);
    drawingContext.imageSmoothingEnabled = true;
  }
}

class Collectible {
  constructor(lane) {
    this.x   = LW + 80;
    this.y   = andaresY[lane];
    this.img = random(imgBons);
    this.w   = 420;
    this.h   = 140;
  }
  update(boost)  { this.x -= (gameSpeed + (boost || 0)); }
  show()         { image(this.img, this.x, this.y, this.w, this.h); }
  hits(d)        { return abs(this.x - d.x) < (this.w + d.w) * 0.35 && abs(this.y - d.y) < (this.h + d.h) * 0.35; }
  offScreen()    { return this.x < -120; }
}

class Obstacle {
  constructor(lane) {
    this.x = LW + 100;
    this.y = andaresY[lane];
    this.w = 420;
    this.h = 140;
  }
  update(boost)  { this.x -= (gameSpeed + (boost || 0)); }
  show()         { image(imgMusica, this.x, this.y, this.w, this.h); }
  hits(d)        { return abs(this.x - d.x) < (this.w + d.w) * 0.33 && abs(this.y - d.y) < (this.h + d.h) * 0.33; }
  offScreen()    { return this.x < -160; }
}

// ── RANKING ───────────────────────────────────────────────────
function saveScore() {
  var ranking = JSON.parse(localStorage.getItem('fnpm_ranking') || '[]');
  ranking.push({ nome: currentUser.nome, score: score });
  ranking.sort(function(a, b) { return b.score - a.score; });
  var top5 = ranking.slice(0, 5);
  localStorage.setItem('fnpm_ranking', JSON.stringify(top5));
  return top5;
}

function triggerGameOver() {
  somGameplay.stop();
  _top5Cache = saveScore();
  gameState  = "RANKING";
}

function drawRankingScreen() {
  image(imgRankingBg, LW / 2, LH / 2, LW, LH);

  var pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 80, 255);

  // Título RANKING piscando
  noStroke();
  fill(80, 30, 5, pulseAlpha);
  textSize(44);
  text("RANKING", 960, 201);
  fill(80, 30, 5);
  textSize(30);
  text("FAVOR NÃO\nPEDIR MÚSICA", 960, 290);

  var rowCentersY = [409, 475, 541, 607, 673];
  var medals = ["1.", "2.", "3.", "4.", "5."];
  for (var i = 0; i < rowCentersY.length; i++) {
    // Borda piscante: verde para 1o lugar, laranja para os demais
    if (i === 0) {
      stroke(50, 200, 50, pulseAlpha);
    } else {
      stroke(255, 140, 0, pulseAlpha);
    }
    strokeWeight(3);
    noFill();
    rect(960, rowCentersY[i], 557, 45);
    noStroke();
    image(imgNameBox, 960, rowCentersY[i], 553, 41);
    if (i < _top5Cache.length) {
      fill(80, 30, 5);
      textSize(18);
      text(medals[i] + "  " + _top5Cache[i].nome.toUpperCase() + "   " + _top5Cache[i].score + " pts",
           960, rowCentersY[i]);
    }
  }

  // Tecla R
  image(imgBtnR, 1490, 300, 109, 77);

  fill(80, 30, 5); textAlign(LEFT, TOP); textSize(21);
  text("Pressione R,\npara recomeçar", 1435, 368);

  // Tecla ESC
  image(imgBtnEsc, 1490, 523, 109, 77);

  fill(80, 30, 5); textAlign(LEFT, TOP); textSize(21);
  text("Pressione ESC\npara jogar como\nNovo Jogador", 1435, 595);

  textAlign(CENTER, CENTER);
}

// ── CONTROLOS ─────────────────────────────────────────────────
function keyPressed() {
  // START → TV_TRANSITION → LOGIN
  if (gameState === "START" && key === ' ') {
    tvTransitionFrame = 0;
    gameState = "TV_TRANSITION";
  }
  // LOADING → LOADING_BAR
  if (gameState === "LOADING" && key === ' ') {
    loadingBarFrame = 0;
    gameState = "LOADING_BAR";
  }
  // Controlos em jogo
  if (gameState === "PLAYING") {
    if (keyCode === UP_ARROW)   dj.descer();
    if (keyCode === DOWN_ARROW) dj.subir();
  }
  // RANKING → PLAYING (R) ou → LOGIN (ESC)
  if (gameState === "RANKING") {
    if (key === 'r' || key === 'R') {
      initGame();
      somGameplay.setVolume(0.4);
      somGameplay.loop();
      gameState = "PLAYING";
    }
    if (keyCode === ESCAPE) {
      inputEmail.value('');
      inputNome.value('');
      showLoginUI();
      gameState = "LOGIN";
    }
  }
}
