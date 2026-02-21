/* let balance = 10000;
let currentBet = 100;
const winTable = {
    '7.jpg': 50,          // 잭팟! (50배)
    'diamond.jpg': 20,    // 고득점 (20배)
    'bell.jpg': 10,       // 중간 (10배)
    'watermelon.jpg': 5,  // 낮음 (5배)
    'grape.jpg': 3,       // 낮음 (3배)
    'cherry.jpg': 2,      // 보너스 느낌 (2배
} */

import * as PIXI from 'pixi.js';

export function createBetting(onBetChange, onAmountChange) {
    const bettingFrame = new PIXI.Graphics();

    const multiplierButtons = [];
    const amountButtons = [];

    bettingFrame.rect(-150, 50, 200, 550)
        .fill({
            fill: {
                type: 'linear',
                x1: 0, y1: 50,
                x2: 0, y2: 550,
                colorStops: [
                    { offset: 0, color: 0x444444 },
                    { offset: 0.5, color: 0x222222 },
                    { offset: 1, color: 0x111111 }
                ]
            }
        });

    // 4. Betting 상단 타이틀
    const titleStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 30,
        fontWeight: 'bold',
        fill: {
            type: 'linear',
            x1: 0, y1: 0,
            x2: 0, y2: 40,
            colorStops: [
                { offset: 0, color: 0xffffff }, // 흰색
                { offset: 1, color: 0xffd700 }  // 금색
            ]
        }, // 그라데이션 텍스트
        stroke: { color: 0x4a1850, width: 5 },
        dropShadow: {
            color: 0x000000,
            blur: 4,
            distance: 4,
            alpha: 0.5
        }
    });

    const title = new PIXI.Text({ text: '배팅 배율', style: titleStyle });
    title.x = -100;
    title.y = 70;
    title.anchor.set(0.1);
    bettingFrame.addChild(title);

    // 배율 버튼 데이터
    const multiplierRates = ['1.2x', '1.5x', '2.0x', '5.0x'];
    const BUTTON_WIDTH = 80;
    const BUTTON_HEIGHT = 50;
    const SPACING = 15; // 버튼 사이 간격

    multiplierRates.forEach((rate, i) => {
        const btn = createGridButton(rate, i, 120, 0xac4e4e, multiplierButtons, (val) => onBetChange(parseFloat(val)));
        bettingFrame.addChild(btn);
    });


    // -- 하단 : 베팅액 버튼 영역
    const amountTitle = new PIXI.Text({ text: '기본 배팅금', style: titleStyle });
    amountTitle.x = -50;
    amountTitle.y = 350;
    amountTitle.anchor.set(0.5);
    bettingFrame.addChild(amountTitle);

    const betAmounts = ['1000', '2000', '3000', '5000'];
    betAmounts.forEach((amount, i) => {
        const btn = createGridButton(amount, i, 390, 0x4e7cac, amountButtons, (val) => onAmountChange(parseFloat(val)));
        bettingFrame.addChild(btn);
    });

    function createGridButton(text, index, startY, color, groupArray, callback) {
        const buttonContainer = new PIXI.Container();

        const col = index % 2;
        const row = Math.floor(index / 2);

        buttonContainer.x = -135 + (col * (BUTTON_WIDTH + SPACING));
        buttonContainer.y = startY + (row * (BUTTON_HEIGHT + SPACING));
        buttonContainer.interactive = true;
        buttonContainer.cursor = 'pointer';

        // 그림자 (약간 더 크게)
        const shadow = new PIXI.Graphics().rect(-2, -2, BUTTON_WIDTH + 4, BUTTON_HEIGHT + 4).fill(0x000000);
        // 몸체
        const body = new PIXI.Graphics().rect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT).fill(color);
        buttonContainer.body = body;

        const style = new PIXI.TextStyle({
            fill: "#ffffff", fontSize: 16, fontWeight: 'bold'
        });
        const buttonText = new PIXI.Text({ text: text, style });
        buttonText.anchor.set(0.5);
        buttonText.x = BUTTON_WIDTH / 2;
        buttonText.y = BUTTON_HEIGHT / 2;

        buttonContainer.addChild(shadow, body, buttonText);
        bettingFrame.addChild(buttonContainer);

        buttonContainer.on('pointerdown', () => {
            body.y = 2;
            buttonText.y = (BUTTON_HEIGHT / 2) + 2;
        });

        buttonContainer.on('pointerup', () => {
            body.y = 0;
            buttonText.y = BUTTON_HEIGHT / 2;
            // [핵심] 내가 속한 그룹(groupArray)의 버튼들만 초기화
            groupArray.forEach(btn => {
                btn.body.tint = 0xffffff; // 흰색 틴트 = 원래 색상
            });

            body.tint = color;

            // rate 대신 인자인 text를 넘기고, callback(인자로 받은 함수)을 실행
            if (callback) callback(text);
        });

        groupArray.push(buttonContainer);
        
        return buttonContainer;
    }


    return { bettingFrame };
}