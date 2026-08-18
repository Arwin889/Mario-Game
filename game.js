const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const winPanel = document.querySelector("#win-panel");
const finalScore = document.querySelector("#final-score");
const panelTitle = document.querySelector("#panel-title");
const panelEmoji = document.querySelector("#panel-emoji");
const playAgainButton = document.querySelector("#play-again");

const hero = {
  size: 32,
  x: 0,
  y: 0,
  speed: 260,
  direction: 0,
  verticalVelocity: 0,
  gravity: 1500,
  jumpVelocity: 600,
  grounded: true,
  jumpsRemaining: 2,
};

const coins = [
  { platform: 0, position: 0.25, collected: false },
  { platform: 0, position: 0.75, collected: false },
  { platform: 1, position: 0.5, collected: false },
  { platform: 2, position: 0.28, collected: false },
  { platform: 2, position: 0.78, collected: false },
  { platform: 3, position: 0.35, collected: false },
  { platform: 3, position: 0.75, collected: false },
  { platform: 4, position: 0.5, collected: false },
  { platform: 5, position: 0.3, collected: false },
  { platform: 6, position: 0.7, collected: false },
];

let score = 0;
let won = false;
let gameOver = false;

let lastFrameTime = 0;

function groundHeightFor(screenHeight) {
  return Math.max(72, Math.round(screenHeight * 0.14));
}

function levelWidth(screenWidth) {
  return Math.max(screenWidth * 5, 2800);
}

function hazardsFor(worldWidth) {
  return [
    { x: worldWidth * 0.4, width: 92 },
    { x: worldWidth * 0.62, width: 105 },
    { x: worldWidth * 0.77, width: 88 },
  ];
}

function platformsFor(screenWidth, screenHeight) {
  return [
    { x: screenWidth * 0.1, y: Math.max(70, screenHeight * 0.12), width: 170 },
    { x: screenWidth * 0.22, y: Math.max(100, screenHeight * 0.18), width: 180 },
    { x: screenWidth * 0.35, y: Math.max(60, screenHeight * 0.1), width: 140 },
    { x: screenWidth * 0.47, y: Math.max(115, screenHeight * 0.2), width: 165 },
    { x: screenWidth * 0.58, y: Math.max(75, screenHeight * 0.13), width: 150 },
    { x: screenWidth * 0.69, y: Math.max(130, screenHeight * 0.22), width: 170 },
    { x: screenWidth * 0.8, y: Math.max(85, screenHeight * 0.15), width: 155 },
    { x: screenWidth * 0.43, y: Math.max(145, screenHeight * 0.24), width: 125 },
    { x: screenWidth * 0.57, y: Math.max(185, screenHeight * 0.3), width: 135 },
    { x: screenWidth * 0.72, y: Math.max(155, screenHeight * 0.26), width: 125 },
  ];
}

function updateHero(deltaTime) {
  if (won || gameOver) return;
  const previousY = hero.y;
  hero.x += hero.direction * hero.speed * deltaTime;
  hero.x = Math.max(0, Math.min(levelWidth(window.innerWidth) - hero.size, hero.x));

  hero.verticalVelocity -= hero.gravity * deltaTime;
  hero.y += hero.verticalVelocity * deltaTime;

  const platforms = platformsFor(levelWidth(window.innerWidth), window.innerHeight);
  const wasFalling = hero.verticalVelocity <= 0;
  let landed = false;

  if (wasFalling) {
    for (const platform of platforms) {
      const overlapsPlatform =
        hero.x + hero.size > platform.x && hero.x < platform.x + platform.width;
      const crossedPlatform =
        previousY >= platform.y && hero.y <= platform.y;

      if (overlapsPlatform && crossedPlatform) {
        hero.y = platform.y;
        hero.verticalVelocity = 0;
        hero.grounded = true;
        hero.jumpsRemaining = 2;
        landed = true;
        break;
      }
    }
  }

  if (landed) return;

  if (hero.y <= 0) {
    hero.y = 0;
    hero.verticalVelocity = 0;
    hero.grounded = true;
    hero.jumpsRemaining = 2;
  } else {
    hero.grounded = false;
  }

  for (const coin of coins) {
    if (coin.collected) continue;

    const platform = platforms[coin.platform];
    const coinX = platform.x + platform.width * coin.position;
    const coinY = platform.y + 26;
    const overlapsCoin =
      hero.x < coinX + 18 &&
      hero.x + hero.size > coinX - 18 &&
      hero.y < coinY + 18 &&
      hero.y + hero.size > coinY - 18;

    if (overlapsCoin) {
      coin.collected = true;
      score += 1;
    }
  }

  if (hero.y === 0) {
    for (const hazard of hazardsFor(levelWidth(window.innerWidth))) {
      const touchesHazard =
        hero.x + hero.size > hazard.x && hero.x < hazard.x + hazard.width;
      if (touchesHazard) {
        gameOver = true;
        panelTitle.textContent = "Game Over";
        panelEmoji.textContent = "😂🫵";
        finalScore.textContent = `Coins collected: ${score} / ${coins.length}`;
        winPanel.style.display = "block";
        break;
      }
    }
  }

  const allCoinsCollected = coins.every((coin) => coin.collected);
  const flagX = levelWidth(window.innerWidth) - 45;
  if (allCoinsCollected && hero.x + hero.size >= flagX) {
    won = true;
    panelTitle.textContent = "You Win!";
    panelEmoji.textContent = "🥳";
    finalScore.textContent = `Coins collected: ${score} / ${coins.length}`;
    winPanel.style.display = "block";
  }
}

function drawScene() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const groundHeight = groundHeightFor(height);
  const grassHeight = Math.max(14, Math.round(height * 0.025));
  const worldWidth = levelWidth(width);
  const cameraX = Math.max(0, Math.min(worldWidth - width, hero.x - width * 0.35));
  const groundTop = height - groundHeight;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // Sky
  context.fillStyle = "#69c9f5";
  context.fillRect(0, 0, width, height);

  // Simple pixel clouds.
  context.fillStyle = "#f4fbff";
  const clouds = [
    { x: worldWidth * 0.05, y: height * 0.16, scale: 1, color: "#ffffff" },
    { x: worldWidth * 0.18, y: height * 0.1, scale: 0.8, color: "#f4fbff" },
    { x: worldWidth * 0.3, y: height * 0.28, scale: 0.65, color: "#dff5ff" },
    { x: worldWidth * 0.42, y: height * 0.14, scale: 0.9, color: "#ffffff" },
    { x: worldWidth * 0.54, y: height * 0.32, scale: 0.7, color: "#e9f8ff" },
    { x: worldWidth * 0.66, y: height * 0.08, scale: 1, color: "#ffffff" },
    { x: worldWidth * 0.78, y: height * 0.24, scale: 0.75, color: "#dff5ff" },
    { x: worldWidth * 0.9, y: height * 0.12, scale: 0.85, color: "#ffffff" },
    { x: worldWidth * 0.96, y: height * 0.3, scale: 0.65, color: "#e9f8ff" },
    { x: worldWidth * 1.04, y: height * 0.1, scale: 0.9, color: "#ffffff" },
  ];
  for (const cloud of clouds) {
    const unit = 12 * cloud.scale;
    context.fillStyle = cloud.color;
    const cloudX = cloud.x - cameraX * 0.25;
    context.fillRect(cloudX, cloud.y + unit, unit * 7, unit * 2);
    context.fillRect(cloudX + unit, cloud.y, unit * 3, unit * 3);
    context.fillRect(cloudX + unit * 4, cloud.y + unit * 0.5, unit * 2, unit * 2.5);
  }

  context.save();
  context.translate(-cameraX, 0);

  // Dirt beneath the grass.
  context.fillStyle = "#633a22";
  context.fillRect(0, height - groundHeight, worldWidth, groundHeight);

  // Grass cap along the top of the ground.
  context.fillStyle = "#58b83f";
  context.fillRect(0, height - groundHeight, worldWidth, grassHeight);

  // Pixel texture in the grass and dirt.
  context.fillStyle = "#78d653";
  for (let x = 10; x < worldWidth; x += 58) {
    context.fillRect(x, height - groundHeight + 4, 10, 4);
  }
  context.fillStyle = "#3f8f32";
  for (let x = 34; x < worldWidth; x += 76) {
    context.fillRect(x, height - groundHeight + 10, 7, 4);
  }
  context.fillStyle = "#80502d";
  for (let x = 18; x < worldWidth; x += 66) {
    context.fillRect(x, height - groundHeight + grassHeight + 18, 13, 7);
  }
  context.fillStyle = "#472918";
  for (let x = 48; x < worldWidth; x += 92) {
    context.fillRect(x, height - groundHeight + grassHeight + 45, 9, 8);
  }

  // Floating platforms.
  context.fillStyle = "#633a22";
  for (const platform of platformsFor(worldWidth, height)) {
    context.fillRect(
      platform.x,
      height - groundHeight - platform.y,
      platform.width,
      16,
    );
    context.fillStyle = "#58b83f";
    context.fillRect(platform.x, height - groundHeight - platform.y, platform.width, 5);
    context.fillStyle = "#633a22";
  }

  // Collectible gold coins.
  const platforms = platformsFor(worldWidth, height);
  for (const coin of coins) {
    if (coin.collected) continue;
    const platform = platforms[coin.platform];
    const coinX = platform.x + platform.width * coin.position;
    const coinY = platform.y + 26;
    context.fillStyle = "#ffd447";
    context.beginPath();
    context.arc(coinX, height - groundHeight - coinY, 10, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#d99b19";
    context.lineWidth = 2;
    context.stroke();
  }

  // Mean alligators waiting in open ground puddles.
  context.fillStyle = "#477cbd";
  for (const hazard of hazardsFor(worldWidth)) {
    context.fillRect(hazard.x, groundTop - 7, hazard.width, 7);
    context.fillStyle = "#31542c";
    context.fillRect(hazard.x + 12, groundTop - 25, hazard.width - 24, 18);
    context.fillRect(hazard.x + 4, groundTop - 20, 12, 12);
    context.fillStyle = "#e8e0c7";
    context.fillRect(hazard.x + 22, groundTop - 29, 7, 7);
    context.fillRect(hazard.x + hazard.width - 29, groundTop - 29, 7, 7);
    context.fillStyle = "#1f1b18";
    context.fillRect(hazard.x + 24, groundTop - 28, 3, 3);
    context.fillRect(hazard.x + hazard.width - 27, groundTop - 28, 3, 3);
    context.fillStyle = "#e94b35";
    context.fillRect(hazard.x + 22, groundTop - 13, hazard.width - 44, 3);
    context.fillStyle = "#477cbd";
  }

  // Decorative flags leading to the finish.
  const flags = [worldWidth * 0.87, worldWidth * 0.95, worldWidth - 45];
  for (let index = 0; index < flags.length; index += 1) {
    const flagX = flags[index];
    context.fillStyle = "#e8e0c7";
    context.fillRect(flagX, groundTop - 150, 6, 150);
    context.fillStyle = index === flags.length - 1 ? "#e94b35" : "#f2c43d";
    context.fillRect(flagX + 6, groundTop - 148, 42, 28);
    context.fillStyle = index === flags.length - 1 ? "#b72f25" : "#c69424";
    context.fillRect(flagX + 6, groundTop - 148, 14, 9);
  }

  // Luigi-style pixel hero standing on top of the ground.
  const heroTop = height - groundHeight - hero.size - hero.y;
  context.fillStyle = "#16833b";
  context.fillRect(hero.x + 7, heroTop, 20, 6); // cap
  context.fillRect(hero.x + 3, heroTop + 5, 25, 5);
  context.fillStyle = "#f3b27d";
  context.fillRect(hero.x + 8, heroTop + 10, 17, 10); // face
  context.fillStyle = "#1f1b18";
  context.fillRect(hero.x + 20, heroTop + 12, 3, 3); // eye
  context.fillRect(hero.x + 15, heroTop + 18, 8, 3); // moustache
  context.fillStyle = "#16833b";
  context.fillRect(hero.x + 5, heroTop + 20, 22, 5); // shirt
  context.fillStyle = "#2364ad";
  context.fillRect(hero.x + 7, heroTop + 24, 18, 6); // overalls
  context.fillRect(hero.x + 4, heroTop + 29, 10, 3);
  context.fillRect(hero.x + 19, heroTop + 29, 10, 3);
  context.fillStyle = "#6c3820";
  context.fillRect(hero.x + 2, heroTop + 28, 12, 4); // shoes
  context.fillRect(hero.x + 19, heroTop + 28, 12, 4);

  context.restore();

  // Score display.
  context.fillStyle = "#ffffff";
  context.font = "bold 20px sans-serif";
  context.textAlign = "left";
  context.fillText(`Coins: ${score}`, 18, 30);

}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;
  updateHero(deltaTime);
  drawScene();
  window.requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (won || gameOver) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    hero.direction = event.key === "ArrowLeft" ? -1 : 1;
  }

  if (event.code === "Space" || event.key === "ArrowUp") {
    event.preventDefault();
    if (hero.jumpsRemaining > 0) {
      hero.verticalVelocity = hero.jumpVelocity;
      hero.grounded = false;
      hero.jumpsRemaining -= 1;
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (
    (event.key === "ArrowLeft" && hero.direction < 0) ||
    (event.key === "ArrowRight" && hero.direction > 0)
  ) {
    hero.direction = 0;
  }
});

window.addEventListener("resize", () => {
  hero.x = Math.max(0, Math.min(levelWidth(window.innerWidth) - hero.size, hero.x));
  hero.y = Math.min(
    hero.y,
    window.innerHeight - groundHeightFor(window.innerHeight) - hero.size,
  );
  drawScene();
});

playAgainButton.addEventListener("click", () => {
  for (const coin of coins) coin.collected = false;
  score = 0;
  won = false;
  gameOver = false;
  panelTitle.textContent = "You Win!";
  panelEmoji.textContent = "🥳";
  hero.x = 80;
  hero.y = 0;
  hero.verticalVelocity = 0;
  hero.grounded = true;
  hero.jumpsRemaining = 2;
  winPanel.style.display = "none";
  drawScene();
});

hero.x = (window.innerWidth - hero.size) / 2;
drawScene();
window.requestAnimationFrame(gameLoop);
