import * as PIXI from 'pixi.js';

export function createSlotButton(x, y, label, onClick) {
    // 버튼 컨테이너 생성
    const button = new PIXI.Container();
    button.x = 400;
    button.y = 620;
    button.interactive = true;
    button.cursor = 'pointer';

    // 2. 버튼 몸체 (그림자)
    // 1. 그림자 (약간 아래로 배치)
    // 1. 하단 두께감 (어두운 빨강 - 그림자 역할)
    // 원을 약간 타원형으로 그리거나 아래로 6px 내립니다.
    const shadow = new PIXI.Graphics()
        .circle(0, 6, 54)
        .fill(0x660000); // 아주 진한 빨강

    // 2. 버튼 몸체 (메인 빨강)
    const body = new PIXI.Graphics()
        .circle(0, 0, 50)
        .fill(0xff0000);

    // 3. 상단 하이라이트 (광택 효과 - 이게 있어야 입체적으로 보입니다)
    const highlight = new PIXI.Graphics()
        .ellipse(-15, -15, 20, 10) // 왼쪽 위에 작은 타원
        .fill({ color: 0xffffff, alpha: 0.3 }); // 반투명 흰색

    const style = new PIXI.TextStyle({
        fill: "#ffffff",
        fontSize: 22,
        fontWeight: 'bold',
        dropShadow: {
            alpha: 0.5,
            angle: 2,
            blur: 2,
            color: '#000000',
            distance: 2,
        },
    });
    const buttonText = new PIXI.Text('SPIN', style);
    buttonText.anchor.set(0.5);

    // 컨테이너에 추가
    button.addChild(shadow, body, buttonText);

    // --- 이벤트 설정 ---
    button.press = () => {
        body.y = 4;
        highlight.y = 4;
        buttonText.y = 4;
        body.tint = 0xcc0000;
    }

    button.release = () => {
        body.y = 0;
        highlight.y = 0;
        buttonText.y = 0;
        body.tint = 0xffffff;
    };
    
    button.on('pointerdown', () => {
        button.press();
    });

    button.on('pointerup', () => {
        button.release();
        if (onClick) onClick();
    });

    button.on('pointerupoutside', () => {
        button.release();
    });

    return button;
}

