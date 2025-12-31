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
  const focusWrapper = document.querySelector(".focus-wrapper");

  if (interval) {
    pauseTimer();
    document.getElementById("toggleBtn").textContent = "▶";

    // STOP wave animation
    focusWrapper.classList.remove("running");

  } else {
    startTimer();
    document.getElementById("toggleBtn").textContent = "⏸";

    // START wave animation
    focusWrapper.classList.add("running");
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

/* ===== mini local player logic ===== */
(function(){
  const tracks = [
    { name: "Jungle Ambience", src: "audio/jungle.mp3" },
    { name: "Rain Ambience", src: "audio/rain.mp3" },
  ];

  const audio = document.getElementById("localAudio");
  const playBtn = document.getElementById("playPauseBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loopBtn = document.getElementById("loopBtn");
  let foreverLoop = false;
  const trackName = document.getElementById("trackName");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("currentTime");
  const remainingTimeEl = document.getElementById("remainingTime");

  let current = 0;
  let isPlaying = false;
  let progUpdater = null; // interval for smooth UI updates
  
function toggleForeverLoop() {
  foreverLoop = !foreverLoop;
  audio.loop = foreverLoop;
  loopBtn.classList.toggle("active", foreverLoop);
}

  function loadTrack(index){
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;
    current = index;
    audio.src = tracks[current].src;
    trackName.textContent = tracks[current].name;
    audio.load();
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    remainingTimeEl.textContent = "-0:00";
    // auto-play if already playing
    if (isPlaying) audio.play().catch(()=>{});
  }

  function play() {
    audio.play().then(()=> {
      isPlaying = true;
      playBtn.textContent = "⏸";
      startProgUpdater();
    }).catch(()=> {
      // autoplay may be blocked; still update UI
      isPlaying = true;
      playBtn.textContent = "⏸";
      startProgUpdater();
    });
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "▶";
    stopProgUpdater();
  }

  function togglePlay() {
    if (!audio.src) {
      loadTrack(0);
      play();
      return;
    }
    if (isPlaying) pause(); else play();
  }

  function prevTrack() {
    loadTrack(current - 1);
    if (!isPlaying) { /* stay paused */ } else play();
  }

  function nextTrack() {
    loadTrack(current + 1);
    if (!isPlaying) { /* stay paused */ } else play();
  }

  function startProgUpdater(){
    stopProgUpdater();
    progUpdater = setInterval(updateProgressUI, 250);
  }
  function stopProgUpdater(){
    if (progUpdater) {
      clearInterval(progUpdater);
      progUpdater = null;
    }
  }

  function updateProgressUI(){
    const dur = audio.duration || 0;
    const cur = audio.currentTime || 0;
    if (dur > 0) {
      const percent = (cur / dur) * 100;
      progress.value = percent;
      currentTimeEl.textContent = formatTime(cur);
      const rem = dur - cur;
      remainingTimeEl.textContent = "-" + formatTime(rem);
    } else {
      progress.value = 0;
      currentTimeEl.textContent = "0:00";
      remainingTimeEl.textContent = "-0:00";
    }
  }

  // Seek when user drags the slider
  let seeking = false;
  progress.addEventListener("input", (e) => {
    seeking = true;
    const percent = Number(e.target.value);
    const dur = audio.duration || 0;
    if (dur > 0) {
      const newTime = (percent / 100) * dur;
      currentTimeEl.textContent = formatTime(newTime);
      remainingTimeEl.textContent = "-" + formatTime(dur - newTime);
    }
  });

  progress.addEventListener("change", (e) => {
    const percent = Number(e.target.value);
    const dur = audio.duration || 0;
    if (dur > 0) {
      audio.currentTime = (percent / 100) * dur;
    }
    seeking = false;
  });

  // Allow click-to-seek on the slider track
progress.addEventListener("click", (e) => {
  const rect = progress.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;

  const dur = audio.duration || 0;
  if (dur > 0) {
    audio.currentTime = percent * dur;
  }
});

  // update on native timeupdate for accuracy when not seeking
  audio.addEventListener("timeupdate", () => {
    if (!seeking) updateProgressUI();
  });

  audio.addEventListener("durationchange", updateProgressUI);

  audio.addEventListener("ended", () => {
  // If looping is ON, browser handles it
  if (foreverLoop) return;

  // Otherwise go to next track
  nextTrack();
});


  // helper: format seconds -> M:SS
  function formatTime(t) {
    t = Math.max(0, Math.floor(t));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${String(s).padStart(2,"0")}`;
  }

  // wire controls
  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", () => { prevTrack(); });
  nextBtn.addEventListener("click", () => { nextTrack(); });
  loopBtn.addEventListener("click", toggleForeverLoop);

  // initialize
  loadTrack(0);

  // expose for debugging (optional)
  window.__miniLocalPlayer = {
    loadTrack, play, pause, nextTrack, prevTrack
  };
})();

function enterApp() {
  const intro = document.getElementById("introScreen");
  const app = document.getElementById("mainApp");

  intro.classList.add("fade-out");

  setTimeout(() => {
    intro.style.display = "none";
    app.classList.remove("hidden");
    app.classList.add("fade-in");
  }, 900);
}

const quotes = [
  "Focus on progress, not perfection.",
  "Small steps every day lead to big results.",
  "Discipline beats motivation.",
  "Your future self will thank you.",
  "Consistency creates confidence.",
  "Start where you are. Use what you have.",
  "Do one thing at a time, but do it well.",
  "Success is built in focused sessions.",
  "Plan smart. Execute harder.",
  "Deep work creates deep results."
];

const quoteBox = document.getElementById("quoteBox");

function shuffleQuote() {
  quoteBox.style.opacity = 0;

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quoteBox.textContent = quotes[randomIndex];
    quoteBox.style.opacity = 1;
  }, 300);
}


// Show a quote immediately
shuffleQuote();

// Change quote every 10 seconds
setInterval(shuffleQuote, 10000);


/* ===== GOOGLE TODO LOGIC ===== */

const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";

  // unfinished first, completed last
  const sortedTodos = [
    ...todos.filter(t => !t.done),
    ...todos.filter(t => t.done)
  ];

  sortedTodos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;

    // 🗑 delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "delete-btn";

    delBtn.addEventListener("click", () => {
      todos = todos.filter(t => t !== todo);
      saveTodos();
      renderTodos();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);

    todoList.appendChild(li);
  });
}



todoInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && todoInput.value.trim()) {
    todos.push({ text: todoInput.value.trim(), done: false });
    todoInput.value = "";
    saveTodos();
    renderTodos();
  }
});

renderTodos();

function openDrawingLink() {
  const input = document.getElementById("drawingLinkInput");
  const link = input.value.trim();

  if (!link) {
    alert("Please paste a Google Drawing link");
    return;
  }

  window.open(link, "_blank");
}

let drawings = JSON.parse(localStorage.getItem("prodeff_drawings")) || [];

function saveDrawing() {
  const nameInput = document.getElementById("drawingNameInput");
  const linkInput = document.getElementById("drawingLinkInput");

  const name = nameInput.value.trim();
  const link = linkInput.value.trim();

  if (!name || !link) {
    alert("Please enter both name and link");
    return;
  }

  drawings.unshift({ name, link });
  localStorage.setItem("prodeff_drawings", JSON.stringify(drawings));

  nameInput.value = "";
  linkInput.value = "";

  renderDrawings();
}

function deleteDrawing(index) {
  drawings.splice(index, 1);
  localStorage.setItem("prodeff_drawings", JSON.stringify(drawings));
  renderDrawings();
}

function renderDrawings() {
  const list = document.getElementById("drawingsList");
  list.innerHTML = "";

  if (drawings.length === 0) {
    list.innerHTML = `<p style="opacity:0.5;">No drawings saved yet</p>`;
    return;
  }

  drawings.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "drawing-item";

    div.innerHTML = `
      <div class="drawing-name">${item.name}</div>
      <div class="drawing-actions">
        <button class="drawing-open" onclick="window.open('${item.link}','_blank')">
          Open
        </button>
        <button class="drawing-delete" onclick="deleteDrawing(${index})">
          ✕
        </button>
      </div>
    `;

    list.appendChild(div);
  });
}

renderDrawings();
