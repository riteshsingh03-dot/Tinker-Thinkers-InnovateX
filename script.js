const buttons = document.querySelectorAll(".task-icon");
const views = document.querySelectorAll(".view");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {

    const view = btn.dataset.view;

    // ⛔ STOP if no internal view (external app like Spotify)
    if (!view) {
      return;
    }

    // sidebar active state
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // switch full workspace view
    views.forEach(v => v.classList.remove("active"));
    document
      .getElementById(view)
      .classList.add("active");
  });
});

let mode = localStorage.getItem("mode") || "pomodoro";
let duration = 25 * 60;
let timeLeft = duration;
let interval = null;
let sessions = Number(localStorage.getItem("sessions")) || 0;
let isBreak = false;

const display = document.getElementById("timeDisplay");
const sessionsEl = document.getElementById("sessions");
const circle = document.querySelector(".progress-ring__circle");
const alarm = document.getElementById("alarmSound");

const radius = 160;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;

function updateDisplay() {
  const totalSeconds = Math.floor(timeLeft);

  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");

  display.textContent = `${m}:${s}`;
}


function setProgress(percent) {
  circle.style.strokeDashoffset =
    circumference - percent * circumference;
}

function setMode(selectedMode) {
  pauseTimer();
  mode = selectedMode;
  isBreak = false;

  // Highlight active mode
  document
    .querySelectorAll(".mode-buttons button")
    .forEach(btn => btn.classList.remove("active"));

  const buttons = document.querySelectorAll(".mode-buttons button");
  const index =
    selectedMode === "pomodoro" ? 0 :
    selectedMode === "custom" ? 1 : 2;

  buttons[index].classList.add("active");

  // Show input ONLY for Custom
  const input = document.getElementById("customInput");
  input.style.display =
    selectedMode === "custom" ? "block" : "none";

  if (mode === "pomodoro") {
    duration = 25 * 60;
    timeLeft = duration;
  }

  if (mode === "custom") {
    const mins = Number(input.value) || 10;
    duration = mins * 60;
    timeLeft = duration;
  }

  if (mode === "countup") {
    duration = Infinity;
    timeLeft = 0;
  }

  localStorage.setItem("mode", mode);
  setProgress(1);
  updateDisplay();
}



let startTimestamp = null;

function startTimer() {
  if (interval) return;

  document.getElementById("toggleBtn").textContent = "⏸";

  startTimestamp = Date.now();
  const initialTime = timeLeft;

  interval = setInterval(() => {
    const elapsed = (Date.now() - startTimestamp) / 1000;

    if (mode === "countup") {
      timeLeft = Math.floor(elapsed);
      updateDisplay();
      return;
    }

    timeLeft = Math.max(initialTime - elapsed, 0);

    // 🔥 smooth progress update
    setProgress(timeLeft / duration);

    // time text updates normally
    updateDisplay();

    if (timeLeft === 0) {
      alarm.play();
      clearInterval(interval);
      interval = null;

      if (mode === "pomodoro") handlePomodoroCycle();
    }
  }, 50); // updates every 50ms (smooth)
}

function pauseTimer() {
  clearInterval(interval);
  interval = null;
  document.getElementById("toggleBtn").textContent = "▶";
}


function resetTimer() {
  pauseTimer();
  timeLeft = mode === "countup" ? 0 : duration;
  setProgress(1);
  updateDisplay();
}

function handlePomodoroCycle() {
  if (!isBreak) {
    sessions++;
    sessionsEl.textContent = sessions;
    localStorage.setItem("sessions", sessions);

    duration = 5 * 60;
    timeLeft = duration;
    isBreak = true;
  } else {
    duration = 25 * 60;
    timeLeft = duration;
    isBreak = false;
  }

  setProgress(1);
  startTimer();
}

sessionsEl.textContent = sessions;

setMode(mode);
function toggleTimer() {
  if (interval) {
    pauseTimer();
    document.getElementById("toggleBtn").textContent = "▶";
  } else {
    startTimer();
    document.getElementById("toggleBtn").textContent = "⏸";
  }
}

function updateCustomTime() {
  if (mode !== "custom") return;

  const input = document.getElementById("customInput");
  const mins = Number(input.value);

  if (!mins || mins <= 0) return;

  duration = mins * 60;
  timeLeft = duration;

  setProgress(1);
  updateDisplay();
}
