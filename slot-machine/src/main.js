import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { createSlotButton } from './button.js';
import { createMachineFrame } from './frame.js';
import { createBetting } from './betting.js';
import { createBalance } from './balance.js';

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
  const container = new PIXI.Container();
  let currentMultiplier = 1.2;
  let currentBaseBet = 1000;
  let balance = 10000; // 초기 자금

  // 4. 이미지 로드 및 텍스처 생성
  const symbolFiles = ['7.jpg', 'diamond.jpg', 'ring.jpg', 'watermelon.jpg', 'grape.jpg', 'cherry.jpg'];
  const textures = [];
  for (const file of symbolFiles) {
    const tex = await PIXI.Assets.load(`/assets/${file}`);
    textures.push(tex);
  }

  async function createReelTexture() {
    const container = new PIXI.Container();
    textures.forEach((tex, i) => {
      const sprite = new PIXI.Sprite(tex);
      sprite.width = SYMBOL_SIZE;
      sprite.height = SYMBOL_SIZE;
      sprite.y = i * SYMBOL_SIZE;
      container.addChild(sprite);
    });
    return app.renderer.generateTexture(container);
  }
  const reelTexture = await createReelTexture();

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
    .roundRect(110, 140, 580, 400, 10)
    .fill(0xffffff);
  gameScene.addChild(reelMask);

  for (let i = 0; i < REEL_COUNT; i++) {
    const reelContainer = new PIXI.Container();
    reelContainer.x = i * (SYMBOL_SIZE + 20) + 120;
    reelContainer.y = 150;

    const tSprite = new PIXI.TilingSprite({
      texture: reelTexture,
      width: SYMBOL_SIZE,
      height: SYMBOL_SIZE * 4,
    });

    reelContainer.addChild(tSprite);
    gameScene.addChild(reelContainer);

    // 각 릴의 상태를 객체로 저장
    reels.push({
      instance: tSprite,
      speed: 0,
      isSpinning: false
    });
  }

  // 조작 버튼
  spinButton = createSlotButton(400, 520, 'SPIN', toggleSpin);
  gameScene.addChild(spinButton);

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
              console.log("모든 릴 정지! 결과 판정 시작");

              // 버튼 다시 활성화
              setSpinButtonState(true);

              // 결과 체크 로직
              //checkResult();
            }
          }
        });
      }, i * 500); // 0.5초 간격 순차 정지
    });
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

