"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type p5Types from "p5";

const ReactP5Wrapper = dynamic(
  () => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
);

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
const paddleHeight = 80;
const paddleWidth = 10;
const winningScore = 11;
let gameOver = false;
let winner = "";
let serveTurn = "player";
let serveCountdown = 0;
let awaitingServe = true;
let gameStarted = false;

const table = { x: 100, y: 50, width: 400, height: 300 };

export default function PingpongGame() {
  const sketch = (p5: p5Types) => {
    p5.setup = () => {
      p5.createCanvas(600, 400);
      resetPositions(p5);
    };

    p5.draw = () => {
      p5.background(30);

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

      if (gameOver) {
        p5.fill(255);
        p5.textAlign(p5.CENTER);
        p5.textSize(24);
        p5.text(winner, p5.width / 2, p5.height / 2);
        p5.text("按 R 鍵重新開始", p5.width / 2, p5.height / 2 + 40);
        return;
      }

      if (!gameStarted) {
        p5.fill(255);
        p5.noStroke();
        p5.textAlign(p5.CENTER);
        p5.textSize(20);
        p5.text("研究生瘦身桌球大作戰！", p5.width / 2, p5.height / 2 - 20);
        p5.text("按下空白鍵開始遊戲", p5.width / 2, p5.height / 2 + 20);
        return;
      }

      if (awaitingServe) {
        p5.fill(255);
        p5.noStroke();
        p5.textAlign(p5.CENTER);
        p5.textSize(16);
        p5.text(
          serveTurn === "player"
            ? "你的回合！按空白鍵發球"
            : "AI 教授準備發球...",
          p5.width / 2,
          p5.height / 2
        );

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

      if (!awaitingServe) {
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY + 7 >= table.y && ballY + 7 <= table.y + table.height) {
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

        if (ballY < -30 || ballY > p5.height + 30) {
          if (ballX < table.x + table.width / 2) playerScore++;
          else aiScore++;
          switchServe(p5);
        }
      }

      if (p5.keyIsDown(p5.UP_ARROW)) playerY -= 6;
      if (p5.keyIsDown(p5.DOWN_ARROW)) playerY += 6;
      playerY = p5.constrain(playerY, 0, p5.height - paddleHeight);

      const targetY = ballY - paddleHeight / 2;
      if (ballSpeedX > 0) {
        if (Math.random() < 0.4) aiY += (targetY - aiY) * 0.1;
      } else {
        if (Math.random() < 0.02) {
          aiY += (table.y + table.height / 2 - paddleHeight / 2 - aiY) * 0.1;
        }
      }
      aiY = p5.constrain(aiY, 0, p5.height - paddleHeight);

      p5.fill(255);
      p5.noStroke();
      const playerPaddleX = table.x - paddleWidth;
      const aiPaddleX = table.x + table.width;
      p5.rect(playerPaddleX, playerY, paddleWidth, paddleHeight);
      p5.rect(aiPaddleX, aiY, paddleWidth, paddleHeight);

      p5.fill(50);
      p5.ellipse(ballX + 2, ballY + 2, 15);
      p5.fill(255);
      p5.ellipse(ballX, ballY, 15);

      if (
        ballX - 7 < playerPaddleX + paddleWidth &&
        ballY > playerY &&
        ballY < playerY + paddleHeight
      ) {
        const relY = playerY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        const angle = norm * (Math.PI / 4);
        ballSpeedX = 6 * Math.cos(angle);
        ballSpeedY = -6 * Math.sin(angle);
        ballX = playerPaddleX + paddleWidth + 7;
        bounceCountPlayer = 0;
      }

      if (ballX + 7 > aiPaddleX && ballY > aiY && ballY < aiY + paddleHeight) {
        const relY = aiY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        const angle = norm * (Math.PI / 4);

        ballSpeedX = -8 * Math.cos(angle);
        ballSpeedY = -8 * Math.sin(angle);
        ballX = aiPaddleX - 7;
        bounceCountAI = 0;
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

      p5.textSize(20);
      p5.fill(255);
      p5.textAlign(p5.CENTER);
      p5.text(`${playerScore} : ${aiScore}`, p5.width / 2, 30);

      if (playerScore >= winningScore || aiScore >= winningScore) {
        gameOver = true;
        winner = playerScore > aiScore ? "研究生成功瘦身！" : "AI 教授打爆你！";
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
          ballSpeedY = Math.random() * 8 - 4;
          awaitingServe = false;
        }
      }

      if (p5.key === "r" || p5.key === "R") {
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
  playerY = p5.height / 2 - paddleHeight / 2;
  aiY = p5.height / 2 - paddleHeight / 2;
  ballX = p5.width / 2;
  ballY = p5.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  bounceCountPlayer = 0;
  bounceCountAI = 0;
  serveCountdown = 0;
};

const switchServe = (p5: p5Types) => {
  ballX = p5.width / 2;
  ballY = p5.height / 2;
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
