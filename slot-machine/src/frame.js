import * as PIXI from 'pixi.js';

export function createMachineFrame() {
    const frame = new PIXI.Graphics();

    // 1. 바깥쪽 본체 (진한 회색 금속 느낌)
    frame.rect(80, 50, 660, 550)
        .fill({
            // 클래스 대신 'linear' 혹은 'radial' 타입을 문자열로 지정합니다.
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

    frame.roundRect(100, 130, 620, 440, 15)
        .stroke({ width: 10, color: 0xffd700, alpha: 0.8 }); // 금색 테두리

    // 3. 릴 뒤쪽 배경 (약간 밝은 회색으로 릴 강조)
    frame.roundRect(110, 140, 600, 420, 10)
        .fill(0x1a1a1a);

    // 4. 상단 장식
    const titleStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
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

    const title = new PIXI.Text({ text: '★ JAEMIN SLOT ★', style: titleStyle });
    title.x = 400;
    title.y = 90;
    title.anchor.set(0.5);

    return { frame, title }
}