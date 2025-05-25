let deck = [];
let playerHand = [];
let dealerHand = [];
let hitProbabilityChart = null;
let winRateChart = null;
let hitChartVisible = true;

let gamesPlayed = 0;
let gamesWon = 0;
let winRateHistory = [];

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// DOM 요소 참조
let playerHandDiv;
let dealerHandDiv;
let playerTotalDiv;
let dealerTotalDiv;
let startBtn;
let hitBtn;
let standBtn;
let toggleChartBtn;
let hitChartContainer;
let probabilityText;
let statusOverlay;
let statusText;
let restartBtn;
let gamesPlayedInfo;
let gamesWonInfo;

// 덱 생성
function createDeck() {
    let d = [];
    for (let suit of suits) {
        for (let value of values) {
            d.push({ suit, value });
        }
    }
    return d;
}

// 덱 셔플
function shuffleDeck(d) {
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
}

// 카드 드로우
function drawCard() {
    if (deck.length === 0) {
        deck = createDeck();
        shuffleDeck(deck);
    }
    return deck.pop();
}

// 카드 값 계산
function getCardValue(card) {
    if (card.value === "A") return [1, 11];
    if (["J", "Q", "K"].includes(card.value)) return [10];
    return [parseInt(card.value)];
}

// 핸드 총점 계산
function calculateTotal(valuesList) {
    let totals = [0];
    for (let vals of valuesList) {
        let newTotals = [];
        for (let total of totals) {
            for (let v of vals) {
                newTotals.push(total + v);
            }
        }
        totals = newTotals;
    }
    let validTotals = totals.filter(t => t <= 21);
    return validTotals.length === 0 ? Math.min(...totals) : Math.max(...validTotals);
}

// 핸드 값 가져오기
function getHandValues(hand) {
    return hand.map(getCardValue);
}

// 카드 표시
function displayHand(container, hand, hideSecondCard = false) {
    container.innerHTML = "";
    hand.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        if (hideSecondCard && index === 1) {
            cardDiv.style.backgroundColor = "#333";
            cardDiv.style.color = "#333";
            cardDiv.textContent = "🂠";
        } else {
            if (card.suit === "♥" || card.suit === "♦") cardDiv.classList.add("red");
            cardDiv.textContent = card.value;
            const suitSpan = document.createElement("span");
            suitSpan.classList.add("suit");
            suitSpan.textContent = card.suit;
            cardDiv.appendChild(suitSpan);
        }
        container.appendChild(cardDiv);
    });
}

// UI 업데이트
function updatePlayerUI() {
    displayHand(playerHandDiv, playerHand);
    const total = calculateTotal(getHandValues(playerHand));
    playerTotalDiv.textContent = `합계: ${total}`;
}

function updateDealerUI(revealAll = false) {
    displayHand(dealerHandDiv, dealerHand, !revealAll);
    const total = calculateTotal(getHandValues(dealerHand));
    dealerTotalDiv.textContent = revealAll ? `합계: ${total}` : "합계: ?";
}

// 승률 텍스트 업데이트
function updateWinRatePercentage() {
    const winRatePercentageElement = document.getElementById('win-rate-percentage');
    if (gamesPlayed === 0) {
        winRatePercentageElement.textContent = '현재 승률: -- %';
    } else {
        const winRate = (gamesWon / gamesPlayed) * 100;
        winRatePercentageElement.textContent = `현재 승률: ${winRate.toFixed(1)} %`;
    }
}

// Safe Hit 확률 계산
function calculateSafeHitProbability(currentHand) {
    const total = calculateTotal(getHandValues(currentHand));
    if (total >= 21 || deck.length === 0) return 0;

    let safeCount = 0;
    for (let card of deck) {
        const vals = getCardValue(card);
        if (vals.some(v => total + v <= 21)) safeCount++;
    }
    return safeCount / deck.length;
}

// Hit 확률 차트
function clearHitProbabilityChart() {
    if (hitProbabilityChart) {
        hitProbabilityChart.data.labels = [];
        hitProbabilityChart.data.datasets[0].data = [];
        hitProbabilityChart.update();
    }
}

function updateHitProbabilityChart(prob) {
    if (!hitProbabilityChart || !hitChartVisible) return;
    const max = 20;
    if (hitProbabilityChart.data.labels.length >= max) {
        hitProbabilityChart.data.labels.shift();
        hitProbabilityChart.data.datasets[0].data.shift();
    }
    hitProbabilityChart.data.labels.push((hitProbabilityChart.data.labels.length + 1).toString());
    hitProbabilityChart.data.datasets[0].data.push((prob * 100).toFixed(1));
    hitProbabilityChart.update();
}

function updateProbabilityText(prob) {
    probabilityText.textContent = `Hit 시 이득을 볼 확률: ${(prob * 100).toFixed(1)} %`;
}

// 게임 통계
function updateGameStatsDisplay() {
    gamesPlayedInfo.textContent = gamesPlayed;
    gamesWonInfo.textContent = gamesWon;
    updateWinRatePercentage(); // 승률 텍스트도 함께 업데이트
}

// 승률 차트 업데이트
function updateWinRateChart() {
    if (!winRateChart) return;
    const currentWinRate = (gamesPlayed === 0) ? 0 : (gamesWon / gamesPlayed) * 100;
    if (winRateHistory.length >= 20) {
        winRateHistory.shift();
    }
    winRateHistory.push(currentWinRate);
    winRateChart.data.labels = winRateHistory.map((_, i) => (i + 1).toString());
    winRateChart.data.datasets[0].data = winRateHistory;
    winRateChart.update();
    updateGameStatsDisplay();
}

// 오버레이 관련
function hideStatusOverlay() {
    statusOverlay.style.display = "none";
}

function showStatusOverlay(text) {
    statusText.textContent = text;
    statusOverlay.style.display = "flex";
    const currentRestartBtn = document.getElementById("restart-btn");
    const newRestartBtn = currentRestartBtn.cloneNode(true);
    currentRestartBtn.parentNode.replaceChild(newRestartBtn, currentRestartBtn);
    restartBtn = newRestartBtn;
    restartBtn.addEventListener("click", restartGameFull);
    hitBtn.disabled = true;
    standBtn.disabled = true;
    startBtn.disabled = true;
}

function restartGameFull() {
    deck = [];
    playerHand = [];
    dealerHand = [];

    hideStatusOverlay();
    startBtn.disabled = false;

    hitBtn.style.display = "none";
    standBtn.style.display = "none";
    hitBtn.disabled = true;
    standBtn.disabled = true;

    playerHandDiv.innerHTML = "";
    dealerHandDiv.innerHTML = "";
    playerTotalDiv.textContent = "합계: 0";
    dealerTotalDiv.textContent = "합계: ?";

    hitChartVisible = true;
    hitChartContainer.style.display = "block";
    toggleChartBtn.textContent = "차트 숨기기";

    clearHitProbabilityChart();
    updateProbabilityText(0);
    updateGameStatsDisplay();
}

// 딜러 턴 처리
async function dealerTurn() {
    updateDealerUI(true);
    let dealerVals = getHandValues(dealerHand);
    let total = calculateTotal(dealerVals);
    while (total < 17) {
        await new Promise(res => setTimeout(res, 800));
        dealerHand.push(drawCard());
        dealerVals = getHandValues(dealerHand);
        total = calculateTotal(dealerVals);
        updateDealerUI(true);
    }
    return total;
}

// 게임 종료 처리
async function endGame() {
    const playerTotal = calculateTotal(getHandValues(playerHand));
    const dealerTotal = await dealerTurn();
    let result = "";

    gamesPlayed++;

    if (playerTotal > 21) result = "패배 (버스트)";
    else if (dealerTotal > 21) { result = "승리 (딜러 버스트)"; gamesWon++; }
    else if (playerTotal > dealerTotal) { result = "승리"; gamesWon++; }
    else if (playerTotal === dealerTotal) result = "무승부";
    else result = "패배";

    updateWinRateChart();
    showStatusOverlay(`게임 결과: ${result}`);
    updateProbabilityText(0);

    hitBtn.style.display = "none";
    standBtn.style.display = "none";
    hitBtn.disabled = true;
    standBtn.disabled = true;
}

// 게임 시작
function initGame() {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];

    updatePlayerUI();
    updateDealerUI(false);
    clearHitProbabilityChart();
    updateGameStatsDisplay();

    if (hitChartVisible) {
        const prob = calculateSafeHitProbability(playerHand);
        updateHitProbabilityChart(prob);
        updateProbabilityText(prob);
    } else {
        updateProbabilityText(0);
    }

    hideStatusOverlay();

    startBtn.disabled = true;
    hitBtn.style.display = "inline-block";
    standBtn.style.display = "inline-block";
    hitBtn.disabled = false;
    standBtn.disabled = false;
}

// 차트 토글
function toggleChart() {
    hitChartVisible = !hitChartVisible;
    hitChartContainer.style.display = hitChartVisible ? "block" : "none";
    toggleChartBtn.textContent = hitChartVisible ? "차트 숨기기" : "차트 보이기";

    if (hitChartVisible && playerHand.length > 0) {
        const prob = calculateSafeHitProbability(playerHand);
        updateHitProbabilityChart(prob);
    } else {
        clearHitProbabilityChart();
        updateProbabilityText(0);
    }
}

// DOMContentLoaded 이벤트 처리
document.addEventListener("DOMContentLoaded", () => {
    playerHandDiv = document.getElementById("player-hand");
    dealerHandDiv = document.getElementById("dealer-hand");
    playerTotalDiv = document.getElementById("player-total");
    dealerTotalDiv = document.getElementById("dealer-total");
    startBtn = document.getElementById("start-btn");
    hitBtn = document.getElementById("hit-btn");
    standBtn = document.getElementById("stand-btn");
    toggleChartBtn = document.getElementById("toggle-chart-btn");
    hitChartContainer = document.getElementById("hit-chart-container");
    probabilityText = document.getElementById("probability-text");
    statusOverlay = document.getElementById("status-overlay");
    statusText = document.getElementById("status-text");
    restartBtn = document.getElementById("restart-btn");
    gamesPlayedInfo = document.getElementById("games-played-info");
    gamesWonInfo = document.getElementById("games-won-info");

    const hitProbabilityCtx = document.getElementById("probability-chart").getContext("2d");
    hitProbabilityChart = new Chart(hitProbabilityCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Hit 시 Safe 확률 (%)",
                data: [],
                fill: false,
                borderColor: "#3498db",
                backgroundColor: "#3498db",
                tension: 0.2,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, title: { display: true, text: '확률 (%)' }, ticks: { stepSize: 20 }},
                x: { title: { display: true, text: '시도 횟수' } }
            }
        }
    });

    const winRateCtx = document.getElementById("win-rate-chart").getContext("2d");
    winRateChart = new Chart(winRateCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "승률 (%)",
                data: [],
                fill: false,
                borderColor: "#27ae60",
                backgroundColor: "#27ae60",
                tension: 0.2,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, title: { display: true, text: '승률 (%)' }},
                x: { title: { display: true, text: '게임 기록' }}
            }
        }
    });

    hitBtn.style.display = "none";
    standBtn.style.display = "none";
    hitBtn.disabled = true;
    standBtn.disabled = true;
    updateGameStatsDisplay();

    startBtn.addEventListener("click", initGame);
    hitBtn.addEventListener("click", () => {
        playerHand.push(drawCard());
        updatePlayerUI();
        const prob = calculateSafeHitProbability(playerHand);
        updateHitProbabilityChart(prob);
        updateProbabilityText(prob);
        if (calculateTotal(getHandValues(playerHand)) > 21) endGame();
    });
    standBtn.addEventListener("click", endGame);
    toggleChartBtn.addEventListener("click", toggleChart);
});