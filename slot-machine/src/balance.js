import * as PIXI from 'pixi.js';

export function createBalance(initialBalance = 30000) {
    const balanceFrame = new PIXI.Graphics();

    balanceFrame.rect(80, 610, 660, 60)
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

    const labelStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#656262' // 라벨은 조금 차분한 색으로
    });

    const label = new PIXI.Text({ text: '잔금', style: labelStyle });
    label.x = 110;
    label.y = 640;
    label.anchor.set(0, 0.5);
    balanceFrame.addChild(label);


    // 3. 실제 금액 숫자 스타일
    const valueStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: {
            type: 'linear',
            x1: 0, y1: 50,
            x2: 0, y2: 550,
            colorStops: [
                { offset: 0, color: 0x444444 },
                { offset: 0.5, color: 0x222222 },
                { offset: 1, color: 0x111111 }
            ]
        },
        stroke: { color: 0x000000, width: 4 },
        dropShadow: { color: 0x000000, distance: 3 }
    });

    const balanceText = new PIXI.Text({
        text: initialBalance.toLocaleString() + "원",
        style: valueStyle
    });

    balanceText.x = 300; // 프레임 오른쪽 끝 부근
    balanceText.y = 640;
    balanceText.anchor.set(1, 0.5); // 오른쪽 정렬
    balanceFrame.addChild(balanceText);

    const updateBalance = (newAmount) => {
        balanceText.text = newAmount.toLocaleString() + "원";
    };

    return { balanceFrame, updateBalance };
}