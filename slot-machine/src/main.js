import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { createSlotButton } from './button.js';
import { createMachineFrame } from './frame.js';
import { createBetting } from './betting.js';
import { createBalance } from './balance.js';
import { calculateWaysWin } from './calculateWaysWin.js';

(async () => {
  // ---1. 초기 설정 앱 생성
  const app = new PIXI.Application();
  await app.init({
    width: 800,
    height: 700,
    backgroundColor: 0x000000,
    antialias: true
  });
  document.body.appendChild(app.canvas);

  // ---2. 메인 컨테이너 생성
  const gameScene = new PIXI.Container();
  app.stage.addChild(gameScene);

  // ---3. 변수 및 상태 선언
  let spinButton = null;; // 전역(스코프) 변수로 선언
  const reels = [];
  const REEL_COUNT = 5;
  const SYMBOL_SIZE = 100;
  const effectContainer = new PIXI.Container();
  let currentMultiplier = 1.2;
  let currentBaseBet = 1000;
  let balance = 30000; // 초기 자금

  // 4. 이미지 로드 및 텍스처 생성
  const symbolFiles = [
    '7.jpg', 'bomb.jpg',            // 초희귀 (각 1개)
    'diamond.jpg', 'ring.jpg',       // 희귀 (각 2개)
    'watermelon.jpg', 'grape.jpg',   // 보통 (각 3개)
    'cherry.jpg', 'cherry.jpg',      // 자주 (4개)
    'blank.jpg', 'blank.jpg', 'blank.jpg', 'blank.jpg' // 빈 공간 (4개)
  ];

  const textures = [];
  const textureMap = {};
  for (const file of symbolFiles) {
    textureMap[file] = await PIXI.Assets.load(`/assets/${file}`);
  }

  // ---4. UI 및 게임 요소 생성
  // 머신 프레임
  const machine = createMachineFrame();
  gameScene.addChild(machine.frame);
  gameScene.addChild(machine.title);

  // 배팅 UI
  const betting = createBetting(
    (val) => {
      currentMultiplier = val;
      console.log("배율 : ", val);
    },
    (val) => {
      currentBaseBet = val;
      console.log("기본베팅 : ", val);
    }
  );
  gameScene.addChild(betting.bettingFrame);

  // 잔금 UI
  const balanceUI = createBalance();
  gameScene.addChild(balanceUI.balanceFrame);

  // 릴 생성
  const reelMask = new PIXI.Graphics()
    .roundRect(110, 140, 600, 420, 10)
    .fill(0xffffff);
  gameScene.addChild(reelMask);

  for (let i = 0; i < REEL_COUNT; i++) {
    // 릴마다 개별적으로 섞인 리스트 생성
    const mySymbols = [...symbolFiles].sort(() => Math.random() - 0.5);
    const uniqueTexture = await createRandomReelTexture(mySymbols); // 헬퍼 함수 사용 가정

    const reelContainer = new PIXI.Container();
    reelContainer.x = i * (SYMBOL_SIZE + 20) + 120;
    reelContainer.y = 150;

    const tSprite = new PIXI.TilingSprite({
      texture: uniqueTexture,
      width: SYMBOL_SIZE,
      height: SYMBOL_SIZE * 4, // 화면에 보여줄 칸수(4칸)만큼만 높이 설정
    });

    reelContainer.addChild(tSprite);
    gameScene.addChild(reelContainer);

    // 마스크 적용 (이미 reelMask가 생성되어 있어야 함)
    reelContainer.mask = reelMask;

    // 각 릴의 상태를 객체로 저장
    reels.push({
      instance: tSprite,
      symbolOrder: mySymbols,
      speed: 0,
      isSpinning: false,
      symbols: []
    });
  }

  // 조작 버튼
  spinButton = createSlotButton(400, 520, 'SPIN', toggleSpin);
  gameScene.addChild(spinButton);
  gameScene.addChild(effectContainer);

  // ---5. 게임 로직함수

  function toggleSpin() {
    const totalBet = currentBaseBet * currentMultiplier;
    const isAnySpinning = reels.some(r => r.isSpinning);

    if (!isAnySpinning && reels.every(r => r.speed === 0)) {
      if (balance >= totalBet) {
        balance -= totalBet; // 잔액 차감
        balanceUI.updateBalance(balance);

        // 버튼 비활성화
        setSpinButtonState(false);
        reels.forEach(r => r.isSpinning = true);

        setTimeout(() => {
          handleStop();
        }, 500);
      } else {
        alert("잔액이 없습니다.");
      }
    }
  }

  function handleStop() {
    reels.forEach((reel, i) => {
      setTimeout(() => {
        reel.isSpinning = false; // Ticker가 더 이상 y값을 더하지 않게 함

        // 현재 위치에서 가장 가까운 기호 칸(100px 단위) 계산
        // + 200~500을 더해주는 이유는 급정거하지 않고 좀 더 회전하다 멈추게 하기 위함
        const finalY = Math.round((reel.instance.tilePosition.y + 300) / 100) * 100;

        gsap.to(reel.instance.tilePosition, {
          y: finalY,
          duration: 2,
          ease: "back.out(1.2)", // 찰진 튕김 효과
          onComplete: () => {
            reel.speed = 0;
            if (i === reels.length - 1) {
              const resultMatrix = getResultMatrix();
              const totalBet = currentBaseBet * currentMultiplier;
              const { totalWin, winningPositions } = calculateWaysWin(resultMatrix, totalBet);

              // --- [추가] 화면에서 모든 폭탄 위치 찾기 ---
              const bombPositions = [];
              resultMatrix.forEach((colArray, colIdx) => {
                colArray.forEach((symbol, rowIdx) => {
                  if (symbol === 'bomb.jpg') {
                    bombPositions.push({ col: colIdx, row: rowIdx, symbol: 'bomb.jpg' });
                  }
                });
              });

              // 당첨 위치와 폭탄 위치를 합쳐서 애니메이션 함수로 전달
              const allEffects = [...winningPositions, ...bombPositions];

              if (allEffects.length > 0) {
                // 당첨금이 있을 때만 잔액 업데이트
                if (totalWin > 0) {
                  balance += totalWin;
                  balanceUI.updateBalance(balance);
                }

                // 당첨 심볼 + 폭탄 심볼 모두 애니메이션 실행
                playWinAnimation(allEffects);
              }

              setSpinButtonState(true);
            }
          }
        });
      }, i * 500); // 0.5초 간격 순차 정지
    });
  }

  // 당첨된 릴을 2차원배열로 변환하는 로직
  function getResultMatrix() {
    const result = [];

    reels.forEach((reel) => {
      const symbolCount = reel.symbolOrder.length;
      const currentY = reel.instance.tilePosition.y;

      // 1. 현재 y좌표를 심볼크기로 나눠서 몇번째 심볼인지 계산
      let shift = Math.round(currentY / SYMBOL_SIZE) % symbolCount;
      if (shift < 0) shift += symbolCount;

      let firstVisibleIndex = (symbolCount - shift) % symbolCount;
      const reelsSymbols = [];
      for (let row = 0; row < 4; row++) {
        // 화면 상단부터 4개의 심볼 추출
        const index = (firstVisibleIndex + row) % symbolCount;
        reelsSymbols.push(reel.symbolOrder[index]);
      }
      result.push(reelsSymbols);
    });
    console.table(result);
    return result;
  }

  // 당첨 효과 이벤트
  function playWinAnimation(winningPositions) {
    gameScene.setChildIndex(effectContainer, gameScene.children.length - 1);
    effectContainer.removeChildren();

    winningPositions.forEach((pos) => {
      const isBomb = pos.symbol === 'bomb.jpg';
      const targetReel = reels[pos.col].instance.parent;
      const posX = targetReel.x + SYMBOL_SIZE / 2;
      const posY = 150 + (pos.row * SYMBOL_SIZE) + SYMBOL_SIZE / 2;

      // 1. Glow Effect (반짝이고 사라짐)
      const glowColor = isBomb ? 0xFF0000 : 0xFFCC00;
      const glow = new PIXI.Graphics()
        .circle(0, 0, SYMBOL_SIZE / 1.5)
        .fill({ color: glowColor, alpha: 0.4 });
      glow.x = posX;
      glow.y = posY;
      glow.scale.set(0);
      effectContainer.addChild(glow);

      if (isBomb) {
        const originalX = gameScene.x;
        const originalY = gameScene.y;

        // 폭탄 전용: 강하게 커졌다가 사라짐 + 화면 흔들기
        gsap.to(glow.scale, { x: 2, y: 2, duration: 0.2, ease: "expo.out" });
        gsap.to(glow, { alpha: 0, duration: 0.5, delay: 0.3, onComplete: () => glow.destroy() });

        gsap.to(gameScene, {
          x: "+=" + (Math.random() * 30 - 15),
          y: "+=" + (Math.random() * 30 - 15),
          duration: 0.05,
          repeat: 8,
          yoyo: true,
          onComplete: () => {
            // 애니메이션이 끝나면 정확히 원래 위치로 되돌립니다.
            gameScene.x = originalX;
            gameScene.y = originalY;
          }
        });
      } else {
        // 일반 당첨: 은은하게 반짝임
        gsap.to(glow.scale, { x: 1.2, y: 1.2, duration: 0.5, ease: "back.out" });
        gsap.to(glow, { alpha: 0, duration: 0.5, delay: 1, onComplete: () => glow.destroy() });
      }
      gsap.to(glow.scale, { x: 1.5, y: 1.5, duration: 0.5, ease: "back.out" });
      gsap.to(glow, { alpha: 0, duration: 0.5, delay: 1.5, onComplete: () => glow.destroy() });

      // 2. Border Effect (몇 번만 흔들리고 소멸)
      const border = new PIXI.Graphics()
        .roundRect(-SYMBOL_SIZE / 2, -SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE, 15)
        .stroke({ width: 6, color: 0xFFD700, alpha: 0.8 });
      border.x = posX;
      border.y = posY;
      effectContainer.addChild(border);

      gsap.to(border.scale, { x: 1.1, y: 1.1, duration: 0.3, repeat: 3, yoyo: true });
      gsap.to(border, { alpha: 0, duration: 0.4, delay: 0.8, onComplete: () => border.destroy() });
      // --- [3. Particles] 사방으로 튀는 입자들 ---
      for (let i = 0; i < 12; i++) {
        const particle = new PIXI.Graphics()
          .rect(-4, -4, 8, 8)
          .fill({ color: 0xFFFFFF }); // 반짝이는 흰색/금색 입자

        particle.x = posX;
        particle.y = posY;
        particle.rotation = Math.random() * Math.PI * 2;
        effectContainer.addChild(particle);

        // 무작위 방향과 거리로 발사
        const angle = (Math.PI * 2 / 12) * i;
        const dist = 100 + Math.random() * 50;

        gsap.to(particle, {
          x: posX + Math.cos(angle) * dist,
          y: posY + Math.sin(angle) * dist,
          alpha: 0,
          rotation: Math.random() * 5,
          duration: 0.8 + Math.random() * 0.5,
          ease: "power2.out",
          onComplete: () => particle.destroy()
        });
      }
    });
  }

  // reel Random으로 배치되도록 하는 이벤트
  async function createRandomReelTexture(symbolList) {
    const container = new PIXI.Container();

    for (let i = 0; i < symbolList.length; i++) {
      const symbol = symbolList[i];
      // 이미 로드된 textureMap에서 가져오거나 Assets.load 사용
      const tex = textureMap[symbol] || await PIXI.Assets.load(`/assets/${symbol}`);
      const sprite = new PIXI.Sprite(tex);
      sprite.width = SYMBOL_SIZE;
      sprite.height = SYMBOL_SIZE;
      sprite.y = i * SYMBOL_SIZE;
      container.addChild(sprite);
    }

    return app.renderer.generateTexture(container);
  }

  // ---6. 시스템 이벤트
  app.ticker.add(() => {
    reels.forEach((reel, index) => {
      if (reel.isSpinning) {
        // 각 릴에 약간의 속도차이를 줌
        const maxSpeed = 20 + index * 5; // 가속: 최대 속도뿐만아니라 가속도에도 index를 활용해 차이를 줌
        reel.speed = Math.min(reel.speed + (0.5 + index * 0.2), maxSpeed);
        reel.instance.tilePosition.y += reel.speed;
      }
    });
  });

  function setSpinButtonState(enabled) {
    if (!spinButton) return;

    spinButton.interactive = enabled;
    spinButton.alpha = enabled ? 1.0 : 0;
    spinButton.cursor = enabled ? 'pointer' : 'default';
  }



  function resize() {
    // 기준 너비, 기준 높이
    const designWidth = 800;
    const designHeight = 700;

    // 현재 브라우저 크기
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 가로 세로 비율 스케일 계산
    const scale = Math.min(windowWidth / designWidth, windowHeight / designHeight);

    gameScene.scale.set(scale);

    // 화면 중앙 정렬
    gameScene.x = (windowWidth - designWidth * scale) / 2;
    gameScene.y = (windowHeight - designHeight * scale) / 2;

    app.renderer.resize(windowWidth, windowHeight);
  }
  window.addEventListener('resize', resize);
  resize();

  // 4. 스페이스바 누르면 모든 릴 스핀 시작/정지
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      toggleSpin();
      if (spinButton) spinButton.press();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      if (spinButton) spinButton.release();
    }
  })
})();

function checkResult(results) {
  const isAllSame = results.every(symbol => symbol === results[0]);

  if (isAllSame) {
    const symbol = results[0];
    const multiplier = winTable[symbol] || 0;

    if (multiplier > 0) {
      const prize = currentBet * multiplier;
      balance += prize;
      alert(`축하합니다! ${symbol} 당첨! ${prize}원을 획득했습니다!`);
    } else {
      alert(`아쉽네요! 같은 모양이지만 배당이 없는 기호입니다.`);
    }
  } else {
    console.log("꽝!");
  }
}

