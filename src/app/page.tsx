"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type p5Types from "p5";

const ReactP5Wrapper = dynamic(
  () => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
);

// 狀態、計分
let playerY = 0;
let aiY = 0;
let ballX = 0;
let ballY = 0;
let ballSpeedX = 0;
let ballSpeedY = 0;
let playerScore = 0;
let aiScore = 0;
let bounceCountPlayer = 0;
let bounceCountAI = 0;
let serveCount = 0;
const paddleHeight = 120; // 放大球拍高度
const paddleWidth = 120; // 放大球拍寬度
const winningScore = 11;
let gameOver = false;
let winner = "";
let serveTurn = "player";
let serveCountdown = 0;
let awaitingServe = true;
let gameStarted = false;

// 新增：記錄上一幀的位置
let lastPlayerY = 0;
let lastAiY = 0;
let playerVelocity = 0;
let aiVelocity = 0;

// 圖片資源
let backgroundImg: p5Types.Image;
let tableImg: p5Types.Image;
let playerImg: p5Types.Image;
let playerImg2: p5Types.Image;
let professorImg: p5Types.Image;
let professorImg2: p5Types.Image;
let instructionImg: p5Types.Image;
let successImg: p5Types.Image;
let loseImg: p5Types.Image;
let scordBoardImg: p5Types.Image;
let playerTurnImg: p5Types.Image;
let professorTurnImg: p5Types.Image;

//字體
let customFont: p5Types.Font;

// 狀態變量
let currentPlayerImg: p5Types.Image;
let currentProfessorImg: p5Types.Image;
let playerImgSwitchTimer = 0;
let professorImgSwitchTimer = 0;

//ui
const table = { x: 0, y: 0, width: 660, height: 495 }; // 放大球桌尺寸
const tableCollision = { x: 0, y: 0, width: 660, height: 425 }; // 實際碰撞區域

export default function PingpongGame() {
  const sketch = (p5: p5Types) => {
    p5.preload = () => {
      //
      customFont = p5.loadFont("/fonts/aura.ttf");
      try {
        backgroundImg = p5.loadImage("/game3/background1.png");
        tableImg = p5.loadImage("/game3/table2.png");
        playerImg = p5.loadImage("/game3/player1.png");
        playerImg2 = p5.loadImage("/game3/player2.png");
        professorImg = p5.loadImage("/game3/professor1.png");
        professorImg2 = p5.loadImage("/game3/professor2.png");
        instructionImg = p5.loadImage("/game3/instruction.png");
        successImg = p5.loadImage("/game3/game_success.png");
        loseImg = p5.loadImage("/game3/game_lose.png");
        scordBoardImg = p5.loadImage("/game3/score_board.png");
        playerTurnImg = p5.loadImage("/game3/player_turn.png");
        professorTurnImg = p5.loadImage("/game3/professor_turn.png");
        currentPlayerImg = playerImg;
        currentProfessorImg = professorImg;
      } catch (error) {
        console.log("圖片載入失敗，使用基本圖形代替");
      }
    };

    p5.windowResized = () => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
      // 重新計算桌子位置
      table.x = (p5.windowWidth - table.width) / 2;
      table.y = (p5.windowHeight - table.height) / 2;
      // 更新碰撞區域位置
      tableCollision.x = table.x;
      tableCollision.y = table.y - 10; // 向上偏移10px
      resetPositions(p5);
    };

    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.textFont(customFont);
      // 初始化桌子位置
      table.x = (p5.windowWidth - table.width) / 2;
      table.y = (p5.windowHeight - table.height) / 2;
      // 初始化碰撞區域位置
      tableCollision.x = table.x;
      tableCollision.y = table.y + 10; // 向上偏移10px
      resetPositions(p5);
    };

    p5.draw = () => {
      // 繪製背景
      if (backgroundImg) {
        p5.image(backgroundImg, 0, 0, p5.windowWidth, p5.windowHeight);
      } else {
        p5.background(30);
      }

      // 繪製桌子
      if (tableImg) {
        p5.image(tableImg, table.x, table.y, table.width, table.height);
      } else {
        p5.fill(0, 100, 180);
        p5.noStroke();
        p5.rect(table.x, table.y, table.width, table.height);
        p5.stroke(255);
        p5.strokeWeight(2);
        p5.line(
          table.x + table.width / 2,
          table.y,
          table.x + table.width / 2,
          table.y + table.height
        );
      }

      if (gameOver) {
        p5.noStroke();
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, p5.width, p5.height);

        if (winner === "player") {
          p5.image(
            successImg,
            p5.width / 2 - successImg.width / 6,
            p5.height / 2 - successImg.height / 6,
            successImg.width / 3,
            successImg.height / 3
          );
        } else {
          p5.image(
            loseImg,
            p5.width / 2 - loseImg.width / 6,
            p5.height / 2 - loseImg.height / 6,
            loseImg.width / 3,
            loseImg.height / 3
          );
        }
        return;
      }

      if (!gameStarted) {
        p5.noStroke();
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, p5.width, p5.height);

        p5.image(
          instructionImg,
          p5.width / 2 - instructionImg.width / 6,
          p5.height / 2 - instructionImg.height / 6,
          instructionImg.width / 3,
          instructionImg.height / 3
        );
        return;
      }

      // 繪製玩家和教授
      const playerPaddleX = table.x - paddleWidth;
      const aiPaddleX = table.x + table.width;
      if (currentPlayerImg) {
        const playerImgX = playerPaddleX - paddleWidth / 2;
        const playerImgY = playerY - paddleHeight / 2;
        p5.image(
          currentPlayerImg,
          playerImgX,
          playerImgY,
          paddleWidth * 2,
          paddleHeight * 2
        );
      } else {
        p5.fill(255);
        p5.noStroke();
        p5.rect(playerPaddleX, playerY, paddleWidth, paddleHeight);
      }

      if (currentProfessorImg) {
        const professorImgX = aiPaddleX - paddleWidth / 2;
        const professorImgY = aiY - paddleHeight / 2;
        p5.image(
          currentProfessorImg,
          professorImgX,
          professorImgY,
          paddleWidth * 2,
          paddleHeight * 2
        );
      } else {
        p5.fill(255);
        p5.noStroke();
        p5.rect(aiPaddleX, aiY, paddleWidth, paddleHeight);
      }

      // 繪製球
      p5.fill(255);
      p5.noStroke();
      p5.ellipse(ballX, ballY, 30, 30);

      if (awaitingServe) {
        // 黑色半透明遮罩
        p5.noStroke();
        p5.fill(0, 0, 0, 100);
        p5.rect(
          p5.width / 2 - p5.width / 6,
          p5.height / 2 - 150,
          p5.width / 3,
          p5.height / 3,
          10,
          10,
          10,
          10
        );

        // 根據 serveTurn 顯示提示圖片
        const img = serveTurn === "player" ? playerTurnImg : professorTurnImg;
        const scale = 1 / 3;
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        const imgX = p5.width / 2 - imgW / 2;
        const imgY = p5.height / 2 - imgH / 2;
        p5.image(img, imgX, imgY, imgW, imgH);

        if (serveTurn === "ai") {
          serveCountdown--;
          if (serveCountdown <= 0) {
            ballX = table.x + table.width - 20;
            ballY = aiY + paddleHeight / 2;
            ballSpeedX = -8;
            ballSpeedY = p5.random(-4, 4);
            awaitingServe = false;
          }
        }
      }

      // 繪製計分板（移到最後，確保顯示在最上層）
      p5.textSize(50);
      p5.textStyle(p5.BOLD);
      p5.fill(0);
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.textAlign(p5.CENTER);
      p5.image(
        scordBoardImg,
        p5.width / 2 - scordBoardImg.width / 12,
        30,
        scordBoardImg.width / 6,
        scordBoardImg.height / 6
      );
      p5.text(
        playerScore,
        p5.width / 2 - scordBoardImg.width / 12 + 68,
        scordBoardImg.height / 12 + 40
      );
      p5.text(
        aiScore,
        p5.width / 2 - scordBoardImg.width / 12 + 218,
        scordBoardImg.height / 12 + 40
      );

      if (playerScore >= winningScore || aiScore >= winningScore) {
        gameOver = true;
        winner = playerScore > aiScore ? "player" : "ai";
      }

      if (!awaitingServe) {
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (
          ballY + 7 >= tableCollision.y &&
          ballY + 7 <= tableCollision.y + tableCollision.height
        ) {
          if (ballX < table.x + table.width / 2 && bounceCountPlayer < 1) {
            bounceCountPlayer++;
          } else if (ballX >= table.x + table.width / 2 && bounceCountAI < 1) {
            bounceCountAI++;
          }
        }

        if (
          bounceCountPlayer > 1 ||
          (ballX > table.x + table.width / 2 &&
            (ballX < table.x || ballX > table.x + table.width))
        ) {
          aiScore++;
          switchServe(p5);
        }
        if (
          bounceCountAI > 1 ||
          (ballX < table.x + table.width / 2 &&
            (ballX < table.x || ballX > table.x + table.width))
        ) {
          playerScore++;
          switchServe(p5);
        }

        if (
          ballY < tableCollision.y ||
          ballY > tableCollision.y + tableCollision.height
        ) {
          if (ballX < table.x + table.width / 2) {
            aiScore++;
          } else {
            playerScore++;
          }
          switchServe(p5);
        }
      }

      if (p5.keyIsDown(p5.UP_ARROW)) playerY -= 6;
      if (p5.keyIsDown(p5.DOWN_ARROW)) playerY += 6;
      playerY = p5.constrain(
        playerY,
        tableCollision.y - 60,
        tableCollision.y + tableCollision.height - paddleHeight
      );

      // 計算玩家球拍速度
      playerVelocity = playerY - lastPlayerY;
      lastPlayerY = playerY;

      const targetY = ballY - paddleHeight / 2;
      if (ballSpeedX > 0) {
        if (Math.random() < 0.4) aiY += (targetY - aiY) * 0.1;
      } else {
        if (Math.random() < 0.02) {
          aiY +=
            (tableCollision.y +
              tableCollision.height / 2 -
              paddleHeight / 2 -
              aiY) *
            0.1;
        }
      }
      aiY = p5.constrain(
        aiY,
        tableCollision.y - 60,
        tableCollision.y + tableCollision.height - paddleHeight
      );

      // 計算AI球拍速度
      aiVelocity = aiY - lastAiY;
      lastAiY = aiY;

      // 更新圖片切換計時器
      if (playerImgSwitchTimer > 0) {
        playerImgSwitchTimer--;
        if (playerImgSwitchTimer === 0) {
          currentPlayerImg = playerImg;
        }
      }

      if (professorImgSwitchTimer > 0) {
        professorImgSwitchTimer--;
        if (professorImgSwitchTimer === 0) {
          currentProfessorImg = professorImg;
        }
      }

      // 碰撞檢測（使用隱形的碰撞區域）
      if (
        ballX - 7 < playerPaddleX + paddleWidth &&
        ballY > playerY &&
        ballY < playerY + paddleHeight
      ) {
        const relY = playerY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        // 基礎角度：根據擊球位置決定
        const baseAngle = norm * (Math.PI / 6); // 增加基礎角度範圍
        // 速度影響：根據球拍移動速度調整
        const velocityFactor = playerVelocity * 0.2; // 增加速度影響
        // 確保球往球桌內打：限制角度範圍
        const angle = Math.max(
          Math.min(baseAngle + velocityFactor, Math.PI / 4),
          -Math.PI / 4
        );
        const speed = 8;
        ballSpeedX = speed * Math.cos(angle);
        ballSpeedY = -speed * Math.sin(angle);
        ballX = playerPaddleX + paddleWidth + 7;
        bounceCountPlayer = 0;
        currentPlayerImg = playerImg2;
        playerImgSwitchTimer = 15;
      }

      if (ballX + 7 > aiPaddleX && ballY > aiY && ballY < aiY + paddleHeight) {
        const relY = aiY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        // 基礎角度：根據擊球位置決定
        const baseAngle = norm * (Math.PI / 6); // 增加基礎角度範圍
        // 速度影響：根據球拍移動速度調整
        const velocityFactor = aiVelocity * 0.2; // 增加速度影響
        // 確保球往球桌內打：限制角度範圍
        const angle = Math.max(
          Math.min(baseAngle + velocityFactor, Math.PI / 4),
          -Math.PI / 4
        );
        const speed = 8;
        ballSpeedX = -speed * Math.cos(angle);
        ballSpeedY = -speed * Math.sin(angle);
        ballX = aiPaddleX - 7;
        bounceCountAI = 0;
        currentProfessorImg = professorImg2;
        professorImgSwitchTimer = 15;
      }

      if (ballX < table.x || ballX > table.x + table.width) {
        if (ballX < table.x && ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (
          ballX > table.x + table.width &&
          ballX < table.x + table.width / 2
        ) {
          aiScore++;
          switchServe(p5);
        }
      }

      if (ballY > table.y + table.height) {
        if (ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (ballX < table.x + table.width / 2) {
          aiScore++;
          switchServe(p5);
        }
      }

      if (ballY < table.y) {
        if (ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (ballX < table.x + table.width / 2) {
          aiScore++;
          switchServe(p5);
        }
      }

      ballX = p5.constrain(ballX, -20, p5.width + 20);
    };

    p5.keyPressed = () => {
      if (p5.key === " ") {
        if (!gameStarted) {
          gameStarted = true;
          return;
        }
        if (awaitingServe && serveTurn === "player") {
          ballX = table.x + 20;
          ballY = playerY + paddleHeight / 2;
          ballSpeedX = 6;
          ballSpeedY = Math.random() * 4 - 2;
          awaitingServe = false;
          // 玩家發球時切換圖片
          currentPlayerImg = playerImg2;
          playerImgSwitchTimer = 15; // 加快切換速度
        } else if (!awaitingServe) {
          // 玩家按空白鍵時也切換圖片
          currentPlayerImg = playerImg2;
          playerImgSwitchTimer = 15;
        }
      }

      if (p5.key === "d" || p5.key === "D") {
        gameOver = false;
        gameStarted = true;
        awaitingServe = true;
        serveTurn = "player";
        serveCount = 0;
        playerScore = 0;
        aiScore = 0;
        resetPositions(p5);
      }
    };
  };

  return <ReactP5Wrapper sketch={sketch} />;
}

const resetPositions = (p5: p5Types) => {
  playerY = table.y + table.height / 2 - paddleHeight / 2;
  aiY = table.y + table.height / 2 - paddleHeight / 2;
  ballX = table.x + table.width / 2;
  ballY = table.y + table.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  bounceCountPlayer = 0;
  bounceCountAI = 0;
  serveCountdown = 0;
};

const switchServe = (p5: p5Types) => {
  ballX = table.x + table.width / 2;
  ballY = table.y + table.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  bounceCountPlayer = 0;
  bounceCountAI = 0;
  awaitingServe = true;
  serveCount++;
  if (serveCount >= 2) {
    serveTurn = serveTurn === "player" ? "ai" : "player";
    serveCount = 0;
  }
  if (serveTurn === "ai") serveCountdown = 60;
};
