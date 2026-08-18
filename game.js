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
let animationTime = 0;
let level = 1;
let level2Enemy = {
  x: 1125,
  y: 205,
  direction: -1,
  speed: 185,
  verticalVelocity: 0,
  grounded: true,
  jumpTimer: 0,
  left: 900,
  right: 1350,
};
let level2EatenTimer = 0;

const level2Coins = [
  { x: 470, y: 145, collected: false },
  { x: 735, y: 225, collected: false },
  { x: 930, y: 145, collected: false },
  { x: 1210, y: 250, collected: false },
  { x: 1510, y: 150, collected: false },
  { x: 1810, y: 230, collected: false },
  { x: 2130, y: 150, collected: false },
  { x: 2470, y: 250, collected: false },
];

const level2Creature = { x: 1350, width: 58 };
const level2Swamps = [
  { x: 790, width: 190 },
  { x: 1560, width: 210 },
];
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

function level2Width(screenWidth) {
  return Math.max(screenWidth * 3.2, 1900);
}

function level2Platforms() {
  return [
    { x: 300, y: 130, width: 180 },
    { x: 610, y: 145, width: 180 },
    { x: 850, y: 130, width: 210 },
    { x: 1120, y: 150, width: 200 },
    { x: 1430, y: 135, width: 180 },
    { x: 1700, y: 150, width: 210 },
    { x: 2020, y: 130, width: 220 },
    { x: 2320, y: 160, width: 190 },
  ];
}

function level2Ladders() {
  return [
    { x: 565, y: 0, height: 145 },
    { x: 1075, y: 0, height: 150 },
    { x: 1655, y: 0, height: 150 },
  ];
}

function enterLevel2() {
  level = 2;
  won = false;
  gameOver = false;
  hero.x = 200;
  hero.y = 0;
  hero.verticalVelocity = 0;
  hero.grounded = true;
  hero.jumpsRemaining = 2;
  level2Enemy.x = 1125;
  level2Enemy.y = 205;
  level2Enemy.direction = -1;
  level2Enemy.verticalVelocity = 0;
  level2Enemy.grounded = true;
  level2Enemy.jumpTimer = 0;
  level2EatenTimer = 0;
  for (const coin of level2Coins) coin.collected = false;
}

function returnToLevel1() {
  level = 1;
  won = false;
  gameOver = false;
  hero.x = levelWidth(window.innerWidth) - 180;
  hero.y = 0;
  hero.verticalVelocity = 0;
  hero.grounded = true;
  hero.jumpsRemaining = 2;
}

function updateLevel2(deltaTime) {
  if (level2EatenTimer > 0) {
    level2EatenTimer -= deltaTime;
    if (level2EatenTimer <= 0) enterLevel2();
    return;
  }

  if (hero.x <= 145 && hero.direction < 0) {
    returnToLevel1();
    return;
  }

  const previousY = hero.y;
  const worldWidth = level2Width(window.innerWidth);
  hero.x += hero.direction * hero.speed * deltaTime;
  hero.x = Math.max(0, Math.min(worldWidth - hero.size, hero.x));
  hero.verticalVelocity -= hero.gravity * deltaTime;
  hero.y += hero.verticalVelocity * deltaTime;

  let landed = false;
  for (const platform of level2Platforms()) {
    const overlaps = hero.x + hero.size > platform.x && hero.x < platform.x + platform.width;
    if (hero.verticalVelocity <= 0 && overlaps && previousY >= platform.y && hero.y <= platform.y) {
      hero.y = platform.y;
      hero.verticalVelocity = 0;
      hero.grounded = true;
      hero.jumpsRemaining = 2;
      landed = true;
      break;
    }
  }
  if (!landed) {
    if (hero.y <= 0) {
      hero.y = 0;
      hero.verticalVelocity = 0;
      hero.grounded = true;
      hero.jumpsRemaining = 2;
    } else hero.grounded = false;
  }

  level2Enemy.direction = hero.x < level2Enemy.x ? -1 : 1;
  level2Enemy.x += level2Enemy.direction * level2Enemy.speed * deltaTime;
  level2Enemy.x = Math.max(0, Math.min(worldWidth - 64, level2Enemy.x));
  level2Enemy.jumpTimer -= deltaTime;

  if (level2Enemy.grounded && level2Enemy.jumpTimer <= 0 && hero.y > level2Enemy.y + 35) {
    level2Enemy.verticalVelocity = level2Enemy.y > 0 ? 560 : 600;
    level2Enemy.grounded = false;
    level2Enemy.jumpTimer = 1.2;
  }
  const enemyPreviousY = level2Enemy.y;
  level2Enemy.verticalVelocity -= hero.gravity * deltaTime;
  level2Enemy.y += level2Enemy.verticalVelocity * deltaTime;
  let enemyLanded = false;
  for (const platform of level2Platforms()) {
    const overlaps = level2Enemy.x + 64 > platform.x && level2Enemy.x < platform.x + platform.width;
    if (level2Enemy.verticalVelocity <= 0 && overlaps && enemyPreviousY >= platform.y && level2Enemy.y <= platform.y) {
      level2Enemy.y = platform.y;
      level2Enemy.verticalVelocity = 0;
      level2Enemy.grounded = true;
      enemyLanded = true;
      break;
    }
  }
  if (!enemyLanded && level2Enemy.y <= 0) {
    level2Enemy.y = 0;
    level2Enemy.verticalVelocity = 0;
    level2Enemy.grounded = true;
  } else if (!enemyLanded) {
    level2Enemy.grounded = false;
  }
  const enemyY = level2Enemy.y;
  const touchesEnemy =
    hero.x + hero.size > level2Enemy.x && hero.x < level2Enemy.x + 64 &&
    hero.y < enemyY + 32 && hero.y + hero.size > enemyY;
  if (touchesEnemy) level2EatenTimer = 1.1;

  for (let index = 0; index < level2Swamps.length; index += 1) {
    const swamp = level2Swamps[index];
    const snakeX = swamp.x + swamp.width / 2 + Math.sin(animationTime * 0.003 + index) * 18;
    const snakeY = 0 + 35 + Math.abs(Math.sin(animationTime * 0.003 + index)) * 10;
    const touchesSnake =
      hero.x + hero.size > snakeX - 25 && hero.x < snakeX + 25 &&
      hero.y < snakeY + 45 && hero.y + hero.size > snakeY - 15;
    if (touchesSnake) {
      gameOver = true;
      panelTitle.textContent = "Game Over";
      panelEmoji.textContent = "😂🫵";
      finalScore.textContent = `Coins collected: ${level2Coins.filter((coin) => coin.collected).length} / ${level2Coins.length}`;
      winPanel.style.display = "block";
      break;
    }
  }

  for (const coin of level2Coins) {
    if (coin.collected) continue;
    if (hero.x < coin.x + 18 && hero.x + hero.size > coin.x - 18 &&
        hero.y < coin.y + 18 && hero.y + hero.size > coin.y - 18) {
      coin.collected = true;
    }
  }

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
  if (level === 2) {
    updateLevel2(deltaTime);
    return;
  }
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
    enterLevel2();
  }
}

function drawLevel2Creature(groundTop) {
  const bob = Math.sin(animationTime * 0.004) * 2;
  const jawOpen = Math.abs(Math.sin(animationTime * 0.004)) * 4;
  const x = level2Creature.x;
  const y = groundTop - 86 + bob;

  context.save();
  context.translate(x, y);
  context.rotate(-0.18);
  // Tall green pixel body from the supplied reference.
  context.fillStyle = "#285f2e";
  context.fillRect(15, 17, 34, 66);
  context.fillRect(5, 30, 12, 48);
  context.fillRect(43, 42, 14, 28);
  context.fillRect(23, 76, 17, 15);
  // Open striped mouth/crown.
  context.fillStyle = "#285f2e";
  context.fillRect(18, 0 - jawOpen, 9, 20);
  context.fillRect(42, 0 - jawOpen, 9, 20);
  context.fillStyle = "#ffffff";
  context.fillRect(27, 3 - jawOpen, 15, 17 + jawOpen * 2);
  context.fillStyle = "#4ea6c7";
  context.fillRect(30, 3 - jawOpen, 4, 17 + jawOpen * 2);
  context.fillRect(37, 3 - jawOpen, 4, 17 + jawOpen * 2);
  context.fillStyle = "#e94b35";
  context.fillRect(34, 3 - jawOpen, 3, 17 + jawOpen * 2);
  // Small eye and brown feet.
  context.fillStyle = "#f5edc8";
  context.fillRect(4, 25, 12, 11);
  context.fillStyle = "#1f1b18";
  context.fillRect(7, 28, 5, 5);
  context.fillStyle = "#8a522e";
  context.fillRect(10, 86, 20, 8);
  context.fillRect(38, 86, 20, 8);
  context.restore();
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

  if (level === 2) {
    drawLevel2(width, height);
    return;
  }

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
  context.fillStyle = "#b87945";
  for (let x = 38; x < worldWidth; x += 118) {
    context.fillRect(x, height - groundHeight + grassHeight + 8, 18, 6);
  }
  context.fillStyle = "#916037";
  for (let x = 76; x < worldWidth; x += 104) {
    context.fillRect(x, height - groundHeight + grassHeight + 31, 15, 6);
  }
  context.fillStyle = "#472918";
  for (let x = 48; x < worldWidth; x += 92) {
    context.fillRect(x, height - groundHeight + grassHeight + 45, 9, 8);
  }
  context.fillStyle = "#382014";
  for (let x = 22; x < worldWidth; x += 147) {
    context.fillRect(x, height - groundHeight + grassHeight + 58, 17, 5);
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
    const spin = Math.abs(Math.cos(animationTime * 0.006));
    const coinWidth = Math.max(3, 18 * spin);
    const coinScreenY = height - groundHeight - coinY;
    // Offset edge gives the coin visible thickness.
    context.fillStyle = "#704608";
    context.beginPath();
    context.ellipse(coinX + 4, coinScreenY + 2, coinWidth, 10, 0, 0, Math.PI * 2);
    context.fill();
    const coinGradient = context.createLinearGradient(
      coinX - coinWidth,
      0,
      coinX + coinWidth,
      0,
    );
    coinGradient.addColorStop(0, "#a96b0b");
    coinGradient.addColorStop(0.22, "#f0b928");
    coinGradient.addColorStop(0.5, "#fff0a0");
    coinGradient.addColorStop(0.78, "#f0b928");
    coinGradient.addColorStop(1, "#a96b0b");
    context.fillStyle = coinGradient;
    context.beginPath();
    context.ellipse(
      coinX,
      coinScreenY,
      coinWidth,
      10,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.strokeStyle = "#8a570b";
    context.lineWidth = 2;
    context.stroke();
    context.strokeStyle = "rgba(255, 243, 155, 0.9)";
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(coinX, coinScreenY, Math.max(1, coinWidth - 3), 7, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(120, 70, 5, 0.7)";
    context.beginPath();
    context.ellipse(coinX, coinScreenY, Math.max(1, coinWidth - 6), 5, 0, 0, Math.PI * 2);
    context.stroke();
    if (spin > 0.45) {
      context.fillStyle = "rgba(255, 255, 220, 0.8)";
      context.fillRect(coinX - coinWidth * 0.45, coinScreenY - 5, 3, 4);
      context.fillStyle = "#b87912";
      context.font = "bold 10px serif";
      context.textAlign = "center";
      context.fillText("★", coinX, coinScreenY + 4);
    }
  }

  // Deep ground puddles.
  for (const hazard of hazardsFor(worldWidth)) {
    context.fillStyle = "#244a68";
    context.fillRect(hazard.x, groundTop - 8, hazard.width, 30);
    context.fillStyle = "#477cbd";
    context.fillRect(hazard.x + 6, groundTop - 5, hazard.width - 12, 22);

    // Faceless green alligator silhouette facing 285 degrees.
    context.save();
    context.translate(hazard.x + hazard.width / 2, groundTop - 7);
    context.rotate((285 * Math.PI) / 180);
    context.fillStyle = "#315f2c";
    context.fillRect(-34, -9, 58, 18); // body and tail
    context.fillRect(18, -14, 25, 28); // head
    context.fillStyle = "#477c35";
    context.fillRect(-22, -14, 34, 5); // back ridge
    context.fillRect(-22, 9, 10, 7); // rear foot
    context.fillRect(12, 9, 10, 7); // front foot
    context.fillStyle = "#f4f1d0";
    context.fillRect(27, -13, 7, 7); // eyeball
    context.fillStyle = "#1f1b18";
    context.fillRect(30, -11, 3, 4); // pupil
    context.fillRect(25, -16, 5, 3); // angled angry eyebrow
    context.fillRect(29, -18, 7, 3);
    const jawOpen = Math.abs(Math.sin(animationTime * 0.004)) * 5;
    context.fillStyle = "#477c35";
    context.fillRect(44, -7 - jawOpen, 22, 5); // upper nozzle
    context.fillRect(44, 3 + jawOpen, 22, 5); // lower nozzle
    context.fillStyle = "#ffffff";
    context.fillStyle = "#e85b50";
    context.fillRect(47, -1 + jawOpen * 0.2, 17, 4); // long tongue
    context.fillStyle = "#ffffff";
    context.fillRect(46, -3 - jawOpen * 0.5, 3, 4);
    context.fillRect(51, -3 - jawOpen * 0.5, 3, 4);
    context.fillRect(56, -3 - jawOpen * 0.5, 3, 4);
    context.fillRect(61, -3 - jawOpen * 0.5, 3, 4);
    context.fillRect(46, 1 + jawOpen * 0.5, 3, 4);
    context.fillRect(51, 1 + jawOpen * 0.5, 3, 4);
    context.fillRect(56, 1 + jawOpen * 0.5, 3, 4);
    context.fillRect(61, 1 + jawOpen * 0.5, 3, 4);
    context.restore();
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

function drawLevel2(width, height) {
  const groundHeight = groundHeightFor(height);
  const worldWidth = level2Width(width);
  const cameraX = Math.max(0, Math.min(worldWidth - width, hero.x - width * 0.35));
  const groundTop = height - groundHeight;

  const skyGradient = context.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, "#6baeb0");
  skyGradient.addColorStop(0.55, "#8cc9b0");
  skyGradient.addColorStop(1, "#1d5940");
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, height);
  const clouds = [
    { x: 180, y: 90, width: 150, color: "rgba(235, 250, 238, .8)" },
    { x: 630, y: 150, width: 110, color: "rgba(205, 239, 235, .62)" },
    { x: 1080, y: 70, width: 180, color: "rgba(255, 255, 255, .72)" },
    { x: 1600, y: 125, width: 130, color: "rgba(214, 244, 235, .6)" },
    { x: 2160, y: 80, width: 190, color: "rgba(255, 255, 255, .76)" },
  ];
  for (const cloud of clouds) {
    const cloudX = cloud.x - cameraX * 0.2;
    context.fillStyle = cloud.color;
    context.fillRect(cloudX, cloud.y + 12, cloud.width, 24);
    context.fillRect(cloudX + 22, cloud.y, cloud.width * 0.35, 38);
    context.fillRect(cloudX + cloud.width * 0.58, cloud.y + 5, cloud.width * 0.25, 31);
  }
  // Faint mountain backdrop with slower parallax.
  const mountainShift = cameraX * 0.12;
  context.fillStyle = "rgba(53, 103, 91, 0.28)";
  context.beginPath();
  context.moveTo(-mountainShift, height * 0.48);
  context.lineTo(190 - mountainShift, height * 0.2);
  context.lineTo(390 - mountainShift, height * 0.48);
  context.lineTo(610 - mountainShift, height * 0.15);
  context.lineTo(850 - mountainShift, height * 0.48);
  context.lineTo(1080 - mountainShift, height * 0.22);
  context.lineTo(1320 - mountainShift, height * 0.48);
  context.lineTo(1550 - mountainShift, height * 0.18);
  context.lineTo(1800 - mountainShift, height * 0.48);
  context.closePath();
  context.fill();
  context.fillStyle = "rgba(31, 76, 65, 0.2)";
  context.beginPath();
  context.moveTo(-300 - mountainShift, height * 0.54);
  context.lineTo(80 - mountainShift, height * 0.28);
  context.lineTo(340 - mountainShift, height * 0.54);
  context.lineTo(760 - mountainShift, height * 0.3);
  context.lineTo(1120 - mountainShift, height * 0.54);
  context.lineTo(1500 - mountainShift, height * 0.27);
  context.lineTo(1900 - mountainShift, height * 0.54);
  context.closePath();
  context.fill();
  context.save();
  context.translate(-cameraX, 0);

  // Dense jungle silhouettes and palm trees.
  for (let x = 40; x < worldWidth; x += 155) {
    context.fillStyle = "#513a25";
    context.fillRect(x, groundTop - 230, 34, 230);
    context.fillStyle = "#785433";
    context.fillRect(x + 9, groundTop - 230, 8, 230);
    context.fillStyle = "#174d32";
    context.fillRect(x - 58, groundTop - 245, 124, 30);
    context.fillRect(x - 38, groundTop - 274, 94, 34);
    context.fillStyle = "#2f7845";
    context.fillRect(x - 77, groundTop - 224, 54, 18);
    context.fillRect(x + 40, groundTop - 226, 58, 18);
    context.fillStyle = "#56a653";
    context.fillRect(x - 26, groundTop - 294, 62, 17);
    context.fillRect(x - 65, groundTop - 263, 42, 12);
    // Hanging vines.
    context.fillStyle = "#397b43";
    context.fillRect(x - 45, groundTop - 214, 6, 78);
    context.fillRect(x + 58, groundTop - 205, 6, 96);
    context.fillRect(x - 50, groundTop - 158, 16, 6);
    context.fillRect(x + 55, groundTop - 126, 16, 6);
  }
  for (let x = 110; x < worldWidth; x += 285) {
    context.fillStyle = "#6a4529";
    context.fillRect(x, groundTop - 190, 16, 190);
    context.fillStyle = "#3f8f47";
    context.fillRect(x - 70, groundTop - 215, 72, 12);
    context.fillRect(x + 10, groundTop - 235, 78, 12);
    context.fillRect(x - 48, groundTop - 250, 70, 12);
  }
  for (let x = 90; x < worldWidth; x += 470) {
    // Palm trunk and crown.
    context.fillStyle = "#76502c";
    context.fillRect(x, groundTop - 245, 18, 245);
    context.fillStyle = "#327747";
    context.fillRect(x - 86, groundTop - 260, 92, 10);
    context.fillRect(x + 14, groundTop - 274, 105, 10);
    context.fillRect(x - 40, groundTop - 292, 78, 10);
    context.fillRect(x + 36, groundTop - 304, 70, 10);
    context.fillStyle = "#5ca34c";
    context.fillRect(x - 60, groundTop - 250, 55, 7);
    context.fillRect(x + 18, groundTop - 285, 60, 7);
  }
  // Thick lower bushes and tropical plants.
  for (let x = 0; x < worldWidth; x += 92) {
    context.fillStyle = x % 184 === 0 ? "#174d32" : "#246b3d";
    context.fillRect(x, groundTop - 38, 78, 38);
    context.fillStyle = "#3f9148";
    context.fillRect(x + 12, groundTop - 57, 25, 30);
    context.fillRect(x + 42, groundTop - 50, 30, 24);
    context.fillStyle = "#66ad50";
    context.fillRect(x + 22, groundTop - 68, 8, 34);
    context.fillRect(x + 56, groundTop - 62, 8, 30);
  }
  for (let x = 25; x < worldWidth; x += 145) {
    context.fillStyle = "#347e42";
    context.fillRect(x, groundTop - 92, 7, 72);
    context.fillRect(x - 18, groundTop - 76, 24, 7);
    context.fillRect(x + 5, groundTop - 62, 25, 7);
    context.fillStyle = "#75b95a";
    context.fillRect(x - 28, groundTop - 84, 12, 5);
    context.fillRect(x + 28, groundTop - 70, 12, 5);
  }
  // Broad canopy bands overhead.
  for (let x = -40; x < worldWidth; x += 210) {
    context.fillStyle = "#123d2b";
    context.fillRect(x, 0, 150, 28);
    context.fillStyle = "#24633b";
    context.fillRect(x + 28, 22, 115, 24);
    context.fillStyle = "#3c8a47";
    context.fillRect(x - 12, 45, 70, 12);
  }
  // Extra canopy curtains and long jungle vines.
  for (let x = 70; x < worldWidth; x += 175) {
    context.fillStyle = "#174d32";
    context.fillRect(x, 50, 22, 90 + (x % 4) * 12);
    context.fillStyle = "#397b43";
    context.fillRect(x - 14, 80, 10, 62);
    context.fillRect(x + 25, 66, 9, 86);
    context.fillStyle = "#66ad50";
    context.fillRect(x - 22, 125, 24, 7);
    context.fillRect(x + 30, 104, 22, 7);
  }
  for (let x = 20; x < worldWidth; x += 120) {
    context.fillStyle = "#2f713d";
    context.fillRect(x, groundTop - 145, 6, 95);
    context.fillRect(x + 28, groundTop - 118, 6, 75);
    context.fillStyle = "#5ca34c";
    context.fillRect(x - 12, groundTop - 120, 18, 6);
    context.fillRect(x + 30, groundTop - 82, 18, 6);
  }

  // Cobblestone temple walls with hanging vines.
  for (const temple of [{ x: 620, w: 270 }, { x: 1450, w: 260 }, { x: 2180, w: 280 }]) {
    context.fillStyle = "#777b68";
    context.fillRect(temple.x, groundTop - 165, temple.w, 165);
    context.fillStyle = "#92947b";
    for (let brickX = temple.x + 10; brickX < temple.x + temple.w - 10; brickX += 55) {
      context.fillRect(brickX, groundTop - 145, 42, 10);
      context.fillRect(brickX + 22, groundTop - 112, 40, 10);
      context.fillRect(brickX, groundTop - 78, 42, 10);
      context.fillRect(brickX + 20, groundTop - 42, 40, 10);
    }
    context.fillStyle = "#2f713d";
    context.fillRect(temple.x + 32, groundTop - 160, 8, 88);
    context.fillRect(temple.x + temple.w - 48, groundTop - 130, 8, 105);
  }

  context.fillStyle = "#504632";
  context.fillRect(0, groundTop, worldWidth, groundHeight);
  context.fillStyle = "#71806a";
  for (let x = 0; x < worldWidth; x += 42) {
    context.fillRect(x + 4, groundTop + 12, 30, 7);
    context.fillRect(x + 20, groundTop + 38, 28, 7);
  }

  // Swamp lakes, lily pads, and animated snakes.
  for (let index = 0; index < level2Swamps.length; index += 1) {
    const swamp = level2Swamps[index];
    context.fillStyle = "#263f43";
    context.fillRect(swamp.x, groundTop - 4, swamp.width, 20);
    context.fillStyle = "#397c72";
    context.fillRect(swamp.x + 7, groundTop - 1, swamp.width - 14, 13);
    context.fillStyle = "#71a94c";
    for (let pad = 0; pad < 4; pad += 1) {
      const padX = swamp.x + 25 + pad * 38;
      const padY = groundTop - 9 - (pad % 2) * 9;
      context.fillRect(padX, padY, 22, 6);
      context.fillRect(padX + 7, padY - 4, 9, 4);
    }
    const snakeX = swamp.x + swamp.width / 2 + Math.sin(animationTime * 0.003 + index) * 18;
    const snakeY = groundTop - 35 - Math.abs(Math.sin(animationTime * 0.003 + index)) * 10;
    context.fillStyle = "#3d893e";
    context.fillRect(snakeX - 8, snakeY, 16, 45);
    context.fillRect(snakeX - 23, snakeY - 10, 46, 20);
    context.fillStyle = "#8bc45a";
    context.fillRect(snakeX - 10, snakeY - 7, 8, 7);
    context.fillRect(snakeX + 2, snakeY - 7, 8, 7);
    context.fillStyle = "#f4f1d0";
    context.fillRect(snakeX - 10, snakeY - 7, 6, 6);
    context.fillRect(snakeX + 4, snakeY - 7, 6, 6);
    context.fillStyle = "#1f1b18";
    context.fillRect(snakeX - 8, snakeY - 5, 3, 3);
    context.fillRect(snakeX + 5, snakeY - 5, 3, 3);
    context.fillStyle = "#ef7890";
    context.fillRect(snakeX - 3, snakeY - 1, 6, 3);
    context.fillRect(snakeX - 2, snakeY - 16, 4, 16);
  }

  for (const ladder of level2Ladders()) {
    context.fillStyle = "#a9783e";
    context.fillRect(ladder.x, groundTop - ladder.height, 7, ladder.height);
    context.fillRect(ladder.x + 32, groundTop - ladder.height, 7, ladder.height);
    for (let y = groundTop - ladder.height + 12; y < groundTop; y += 20) {
      context.fillRect(ladder.x, y, 39, 6);
    }
  }

  for (const platform of level2Platforms()) {
    context.fillStyle = "#555d4c";
    context.fillRect(platform.x, groundTop - platform.y, platform.width, 16);
    context.fillStyle = "#71806a";
    context.fillRect(platform.x, groundTop - platform.y, platform.width, 5);
    context.fillStyle = "#2f713d";
    context.fillRect(platform.x + 20, groundTop - platform.y - 5, 7, 10);
    context.fillRect(platform.x + platform.width - 30, groundTop - platform.y - 8, 7, 13);
  }

  // Return flag at the beginning of Level 2.
  const returnFlagX = 105;
  context.fillStyle = "#e8e0c7";
  context.fillRect(returnFlagX, groundTop - 135, 6, 135);
  context.fillStyle = "#f2c43d";
  context.fillRect(returnFlagX + 6, groundTop - 133, 40, 26);
  context.fillStyle = "#c69424";
  context.fillRect(returnFlagX + 6, groundTop - 133, 13, 8);

  // Pond beneath the green creature.
  context.fillStyle = "#214f4d";
  context.fillRect(level2Creature.x - 28, groundTop - 5, level2Creature.width + 56, 18);
  context.fillStyle = "#32736e";
  context.fillRect(level2Creature.x - 20, groundTop - 2, level2Creature.width + 40, 10);
  drawLevel2Creature(groundTop);

  for (const coin of level2Coins) {
    if (coin.collected) continue;
    const spin = Math.abs(Math.cos(animationTime * 0.006));
    const coinWidth = Math.max(3, 16 * spin);
    const coinY = groundTop - coin.y;
    context.fillStyle = "#80500b";
    context.beginPath();
    context.ellipse(coin.x + 4, coinY + 2, coinWidth, 10, 0, 0, Math.PI * 2);
    context.fill();
    const coinGradient = context.createLinearGradient(coin.x - coinWidth, 0, coin.x + coinWidth, 0);
    coinGradient.addColorStop(0, "#a96b0b");
    coinGradient.addColorStop(0.3, "#f0b928");
    coinGradient.addColorStop(0.5, "#fff0a0");
    coinGradient.addColorStop(0.7, "#f0b928");
    coinGradient.addColorStop(1, "#a96b0b");
    context.fillStyle = coinGradient;
    context.beginPath();
    context.ellipse(coin.x, coinY, coinWidth, 10, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#8a570b";
    context.lineWidth = 2;
    context.stroke();
    if (spin > 0.45) {
      context.fillStyle = "#b87912";
      context.font = "bold 10px serif";
      context.textAlign = "center";
      context.fillText("★", coin.x, coinY + 4);
    }
  }

  // Angry gorilla boss; during the eat animation it expands toward the hero.
  const enemyScale = level2EatenTimer > 0 ? 1 + (1.1 - level2EatenTimer) * 0.7 : 1;
  context.save();
  context.translate(level2Enemy.x, groundTop - level2Enemy.y);
  context.scale(enemyScale, enemyScale);
  context.fillStyle = "#38251f";
  context.fillRect(12, 8, 40, 39); // broad torso
  context.fillRect(-5, 18, 18, 28); // left arm
  context.fillRect(50, 18, 18, 28); // right arm
  context.fillRect(-10, 38, 20, 13); // left fist
  context.fillRect(52, 38, 20, 13); // right fist
  context.fillStyle = "#68412e";
  context.fillRect(17, 0, 32, 29); // head
  context.fillRect(23, -8, 20, 12); // brow ridge
  context.fillStyle = "#b87952";
  context.fillRect(25, 13, 17, 13); // muzzle
  context.fillStyle = "#f4e3b0";
  context.fillRect(22, 8, 7, 6);
  context.fillRect(38, 8, 7, 6);
  context.fillStyle = "#1f1b18";
  context.fillRect(25, 10, 4, 4);
  context.fillRect(38, 10, 4, 4);
  context.fillRect(21, 3, 12, 4); // angry brow
  context.fillRect(36, 3, 12, 4);
  context.fillStyle = "#1f1b18";
  context.fillRect(29, 22, 11, 5); // angry mouth
  context.fillStyle = "#ffffff";
  context.fillRect(30, 22, 3, 3);
  context.fillRect(36, 22, 3, 3);
  context.restore();

  // Leaves clustered around the boss platform.
  context.fillStyle = "#4b9c4c";
  for (let leaf = 0; leaf < 7; leaf += 1) {
    context.fillRect(840 + leaf * 28, groundTop - 25 - (leaf % 3) * 14, 18, 7);
  }

  // Same Luigi-style pixel hero used in Level 1.
  const heroTop = groundTop - hero.size - hero.y;
  context.fillStyle = "#16833b";
  context.fillRect(hero.x + 7, heroTop, 20, 6);
  context.fillRect(hero.x + 3, heroTop + 5, 25, 5);
  context.fillStyle = "#f3b27d";
  context.fillRect(hero.x + 8, heroTop + 10, 17, 10);
  context.fillStyle = "#1f1b18";
  context.fillRect(hero.x + 20, heroTop + 12, 3, 3);
  context.fillRect(hero.x + 15, heroTop + 18, 8, 3);
  context.fillStyle = "#16833b";
  context.fillRect(hero.x + 5, heroTop + 20, 22, 5);
  context.fillStyle = "#2364ad";
  context.fillRect(hero.x + 7, heroTop + 24, 18, 6);
  context.fillRect(hero.x + 4, heroTop + 29, 10, 3);
  context.fillRect(hero.x + 19, heroTop + 29, 10, 3);
  context.fillStyle = "#6c3820";
  context.fillRect(hero.x + 2, heroTop + 28, 12, 4);
  context.fillRect(hero.x + 19, heroTop + 28, 12, 4);
  context.restore();

  context.fillStyle = "#ffffff";
  context.font = "bold 20px sans-serif";
  context.textAlign = "left";
  context.fillText(
    `Coins: ${level2Coins.filter((coin) => coin.collected).length}`,
    18,
    30,
  );
  if (level2EatenTimer > 0) {
    context.textAlign = "center";
    context.font = "bold 26px sans-serif";
    context.fillText("CHOMP!", width / 2, height / 2);
  }
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;
  animationTime = timestamp;
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
