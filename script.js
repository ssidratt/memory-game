const symbols = ["🍓", "🍋", "🍉", "🍇", "🥝", "🍒", "🍑", "🍍"];

let firstCard = null;
let secondCard = null;
let isLocked = false;
let moves = 0;
let matchedPairs = 0;
let closePairTimer = null;
let gameFinished = false;

const app = createElement("main", "app");
const header = createElement("header", "header");
const title = createElement("h1", "title", "Memory Game");

const headerButtons = createElement("div", "header-buttons");
const newGameButton = createButton("Новая игра", startNewGame);
const leaderboardButton = createButton("Таблица лидеров", showLeaderboard);

headerButtons.append(newGameButton, leaderboardButton);
header.append(title, headerButtons);

const stats = createElement("section", "stats");
const movesElement = createElement("span", "moves");
const pairsElement = createElement("span", "pairs");

stats.append(movesElement, pairsElement);

const gameBoard = createElement("section", "game-board");

app.append(header, stats, gameBoard);
document.body.append(app);

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createButton(text, handler) {
  const button = createElement("button", "button", text);
  button.type = "button";
  button.addEventListener("click", handler);
  return button;
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function createDeck() {
  return shuffle([...symbols, ...symbols]);
}

function updateStats() {
  movesElement.textContent = `Ходы: ${moves}`;
  pairsElement.textContent = `Пары: ${matchedPairs} из 8`;
}

function createCard(symbol) {
  const card = createElement("button", "card");
  card.type = "button";
  card.setAttribute("aria-label", "Закрытая карточка");

  const inner = createElement("span", "card-inner");
  const front = createElement("span", "card-front");
  const back = createElement("span", "card-back", symbol);

  inner.append(front, back);
  card.append(inner);

  card.dataset.symbol = symbol;

  card.addEventListener("click", () => handleCardClick(card));

  return card;
}

function renderBoard() {
  gameBoard.replaceChildren();

  const deck = createDeck();

  deck.forEach((symbol) => {
    gameBoard.append(createCard(symbol));
  });
}

function handleCardClick(card) {
  if (
    isLocked ||
    gameFinished ||
    card === firstCard ||
    card.classList.contains("open") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  card.classList.add("open");
  card.setAttribute("aria-label", `Карточка ${card.dataset.symbol}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  updateStats();

  checkPair();
}

function checkPair() {
  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    matchedPairs += 1;
    updateStats();

    resetSelection();

    if (matchedPairs === symbols.length) {
      finishGame();
    }

    return;
  }

  isLocked = true;

  closePairTimer = setTimeout(() => {
    firstCard.classList.remove("open");
    secondCard.classList.remove("open");

    firstCard.setAttribute("aria-label", "Закрытая карточка");
    secondCard.setAttribute("aria-label", "Закрытая карточка");

    resetSelection();
    isLocked = false;
    closePairTimer = null;
  }, 1000);
}

function resetSelection() {
  firstCard = null;
  secondCard = null;
}

function startNewGame() {
  if (closePairTimer !== null) {
    clearTimeout(closePairTimer);
    closePairTimer = null;
  }

  closeModal();

  firstCard = null;
  secondCard = null;
  isLocked = false;
  moves = 0;
  matchedPairs = 0;
  gameFinished = false;

  updateStats();
  renderBoard();
}

function finishGame() {
  gameFinished = true;
  saveResult(moves);

  setTimeout(() => {
    showWinModal();
  }, 300);
}

function showWinModal() {
  const content = createElement("div");

  const title = createElement("h2", "modal-title", "Победа! 🎉");
  const text = createElement(
    "p",
    "modal-text",
    `Вы нашли все пары за ${moves} ходов.`,
  );

  const buttons = createElement("div", "modal-buttons");

  const newGame = createButton("Новая игра", startNewGame);
  const close = createButton("Закрыть", closeModal);

  buttons.append(newGame, close);
  content.append(title, text, buttons);

  openModal(content);
}

function getResults() {
  const savedResults = localStorage.getItem("memoryGameResults");

  if (!savedResults) {
    return [];
  }

  try {
    const parsedResults = JSON.parse(savedResults);

    if (!Array.isArray(parsedResults)) {
      return [];
    }

    return parsedResults;
  } catch {
    return [];
  }
}

function saveResult(resultMoves) {
  const results = getResults();

  results.push({
    moves: resultMoves,
    date: new Date().toISOString(),
  });

  results.sort((a, b) => {
    if (a.moves !== b.moves) {
      return a.moves - b.moves;
    }

    return new Date(a.date) - new Date(b.date);
  });

  const bestResults = results.slice(0, 10);

  localStorage.setItem("memoryGameResults", JSON.stringify(bestResults));
}

function formatDate(dateString) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function showLeaderboard() {
  const results = getResults();

  const content = createElement("div");
  const title = createElement("h2", "modal-title", "Таблица лидеров");

  content.append(title);

  if (results.length === 0) {
    const empty = createElement("p", "empty-results", "Пока нет результатов");

    content.append(empty);
  } else {
    const list = createElement("ol", "results-list");

    const listHeader = createElement("li", "result-item results-header");

    listHeader.append(
      createElement("span", "", "Место"),
      createElement("span", "", "Ходы"),
      createElement("span", "", "Дата"),
    );

    list.append(listHeader);

    results.forEach((result, index) => {
      const item = createElement("li", "result-item");

      item.append(
        createElement("span", "", String(index + 1)),
        createElement("span", "", String(result.moves)),
        createElement("span", "", formatDate(result.date)),
      );

      list.append(item);
    });

    content.append(list);
  }

  const buttons = createElement("div", "modal-buttons");
  const close = createButton("Закрыть", closeModal);

  buttons.append(close);
  content.append(buttons);

  openModal(content);
}

function openModal(content) {
  closeModal();

  const overlay = createElement("div", "modal-overlay");
  const modal = createElement("div", "modal");

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  modal.append(content);
  overlay.append(modal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.body.append(overlay);
  document.body.classList.add("modal-open");
}

function closeModal() {
  const overlay = document.querySelector(".modal-overlay");

  if (overlay) {
    overlay.remove();
  }

  document.body.classList.remove("modal-open");
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

updateStats();
renderBoard();
