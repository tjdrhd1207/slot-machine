const WIN_TABLE = {
    '7.jpg': 10,          // 50 -> 10으로 하향
    'diamond.jpg': 5,     // 20 -> 5
    'ring.jpg': 2,        // 10 -> 2
    'watermelon.jpg': 1.5,
    'grape.jpg': 0.8,     // 본전보다 못하게 설정하기도 함
    'cherry.jpg': 0.5     // 맞췄지만 손해인 구간 (긴장감 유지용)
};

export function calculateWaysWin(resultMatrix, totalBet) {
    console.log("매트릭스");
    console.log(resultMatrix);
    let totalWin = 0;
    const symbols = Object.keys(WIN_TABLE);
    let winningPositions = []; // 당첨된 좌표 저장

    symbols.forEach(symbol => {
        let matchCount = 0;
        let colIndicates = [];

        for (let col = 0; col < 5; col++) {
            const rows = [];
            const hasBombInCol = resultMatrix[col].some(s => s === 'bomb.jpg');

            // 폭탄이 있으면 이 열은 연결을 끊어버림 (함정!)
            if (hasBombInCol) {
                console.log(`${col}열에 폭탄이 있어 당첨이 차단됨!`);
                break;
            }

            resultMatrix[col].forEach((s, row) => {
                if (s === symbol) rows.push(row);
            });

            if (rows.length > 0) {
                matchCount++;
                colIndicates.push(rows);
            } else {
                break;
            }
        }
        if (matchCount >= 3) {
            console.log("매치카운트 3이상!!");
            // 중복당첨 계산
            const ways = colIndicates.reduce((acc, curr) => acc * curr.length, 1);
            totalWin += (ways * WIN_TABLE[symbol] * totalBet);

            // 당첨 좌표 기록
            for (let col = 0; col < matchCount; col++) {
                colIndicates[col].forEach(row => {
                    winningPositions.push({ col, row, symbol });
                });
            }
        }
    });

    return { totalWin, winningPositions };
}