/************ TASKS ************/
const MAX_TASKS = 10;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskList = document.getElementById("taskList");
const stats = document.getElementById("stats");

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.dataset.index = index;
    li.className = task.done ? "done" : "";
    li.draggable = true;

    if (task.editing) {
      li.innerHTML = `
        <input class="edit-input" value="${task.text}" />
        <button onclick="saveEdit(${index})">Save</button>
        <button onclick="cancelEdit(${index})">Cancel</button>
      `;
    } else {
      li.innerHTML = `
        <span onclick="toggleTask(${index})">${task.text}</span>
        <div class="actions">
          <button onclick="editTask(${index})">Edit</button>
          <button onclick="deleteTask(${index})">✕</button>
        </div>
      `;
    }

    addDragHandlers(li);
    taskList.appendChild(li);
  });

  const completed = tasks.filter(t => t.done).length;
  stats.textContent =
    `Completed ${completed} of ${tasks.length} tasks (${MAX_TASKS - tasks.length} slots left)`;
}

function addTask() {
  const input = document.getElementById("taskInput");
  if (!input.value.trim()) return;

  if (tasks.length >= MAX_TASKS) {
    alert("You can only have up to 10 tasks.");
    return;
  }

  tasks.push({ text: input.value, done: false, editing: false });
  input.value = "";
  saveTasks();
  renderTasks();
}
/*pressing enter equals clicking on "Enter" button*/
const taskInput = document.getElementById("taskInput");

taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTask();
  }
});






function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  saveTasks();
  renderTasks();
}

function deleteTask(i) {
  tasks.splice(i, 1);
  saveTasks();
  renderTasks();
}

function editTask(i) {
  tasks[i].editing = true;
  renderTasks();
}

function saveEdit(i) {
  const input = document.querySelector(`li[data-index="${i}"] .edit-input`);
  const text = input.value.trim();
  if (!text) return alert("Task cannot be empty.");

  tasks[i].text = text;
  tasks[i].editing = false;
  saveTasks();
  renderTasks();
}

function cancelEdit(i) {
  tasks[i].editing = false;
  renderTasks();
}

/************ DRAGGING ************/
let draggedIndex = null;

function addDragHandlers(item) {
  // Desktop Handlers (Keep for cross-device use)
  item.addEventListener("dragstart", () => {
    draggedIndex = Number(item.dataset.index);
    item.classList.add("dragging");
  });
  item.addEventListener("dragover", e => e.preventDefault());
  item.addEventListener("drop", () => {
    const targetIndex = Number(item.dataset.index);
    handleReorder(draggedIndex, targetIndex);
  });
  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    draggedIndex = null;
  });

  // iOS/Android Touch Handlers
  item.addEventListener("touchstart", (e) => {
    draggedIndex = Number(item.dataset.index);
    item.classList.add("dragging");
  }, { passive: true });

  item.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevents scrolling while dragging
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetLi = target?.closest('li');
    
    if (targetLi && targetLi !== item) {
      const targetIndex = Number(targetLi.dataset.index);
      handleReorder(draggedIndex, targetIndex);
      draggedIndex = targetIndex; // Update index as we move
    }
  }, { passive: false });

  item.addEventListener("touchend", () => {
    item.classList.remove("dragging");
    draggedIndex = null;
  });
}

// Helper to consolidate logic
function handleReorder(from, to) {
  if (from === null || from === to) return;
  const moved = tasks.splice(from, 1)[0];
  tasks.splice(to, 0, moved);
  saveTasks();
  renderTasks();
}

/************ POMODORO ************/
let timer = null;
let timeLeft = 10 * 60;
let isRunning = false;

const timerBtn = document.getElementById("timerBtn");

function toggleTimer() {
  if (!isRunning) {
    startTimer();
    timerBtn.textContent = "Pause";
    isRunning = true;
  } else {
    pauseTimer();
    timerBtn.textContent = "Resume";
    isRunning = false;
  }
}

function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      stopTimer();
      alert("Time’s up!");
    }
    updateTimer();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
}


function stopTimer() {
  clearInterval(timer);
  timer = null;
  isRunning = false;
  timerBtn.textContent = "Start";
}

function resetTimer() {
  stopTimer();
  timeLeft = 10 * 60;
  updateTimer();
}

function changeTime(min) {
  timeLeft += min * 60;
  timeLeft = Math.max(5 * 60, Math.min(timeLeft, 60 * 60));
  updateTimer();
}

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById("timerDisplay").textContent =
    `${m}:${s.toString().padStart(2, "0")}`;
}

updateTimer();


/* TAB SWITCHING */
function switchTab(tabId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");

  const index = ["mantra", "todo", "notes", "more"].indexOf(tabId);
  document.querySelectorAll(".tabs button")[index].classList.add("active");
}


/************ MANTRA ************/
let MANTRA_DURATION =
  Number(localStorage.getItem("mantraDuration")) || 15;



const CIRCLE_LENGTH = 879;

let mantraTimer = null;
let mantraTimeLeft = MANTRA_DURATION;

const mantraBtn = document.getElementById("mantraBtn");
const progressCircle = document.getElementById("progressCircle");
const mantraTextDiv = document.getElementById("mantraText");

const MANTRA_COLORS = {
  20: "#16a34a",
  40: "#2563eb",
  60: "#7c3aed"
};


let customMantra =
  localStorage.getItem("customMantra") ||
  "침착하고 차분하게\n즐거운 마음으로\n나는 할수있다";

function loadMantraDisplay() {
  mantraTextDiv.innerHTML = customMantra
    .split("\n")
    .filter(l => l.trim())
    .map(l => `<p>${l}</p>`)
    .join("");
}

function toggleMantraTimer() {
  mantraTimer ? resetMantraTimer() : startMantraTimer();
}


/************ MANTRA animating circular timer ************/
let mantraRAF = null;
let mantraStartTime = null;
let mantraDurationMs = MANTRA_DURATION * 1000;

let mantraState = "idle"; 
// "idle" | "running" | "completed"

function toggleMantraTimer() {
  if (mantraState === "idle") {
    startMantraTimer();
  } else if (mantraState === "running") {
    resetMantraTimer();
  } else if (mantraState === "completed") {
    resetMantraTimer();
  }
}

function startMantraTimer() {
  hardResetAnimation();

  mantraDurationMs = MANTRA_DURATION * 1000;
  mantraStartTime = performance.now();
  mantraState = "running";
  mantraBtn.textContent = "Reset";

  mantraRAF = requestAnimationFrame(animateMantra);
}

function animateMantra(now) {
  if (mantraState !== "running") return;

  const elapsed = now - mantraStartTime;
  const progress = Math.min(elapsed / mantraDurationMs, 1);

  progressCircle.style.strokeDashoffset =
    CIRCLE_LENGTH * (1 - progress);

  if (progress < 1) {
    mantraRAF = requestAnimationFrame(animateMantra);
  } else {
    completeMantraTimer();
  }
}

function completeMantraTimer() {
  cancelAnimationFrame(mantraRAF);
  mantraRAF = null;

  mantraState = "completed";
  progressCircle.style.strokeDashoffset = 0; // fully colored
  mantraBtn.textContent = "Done";
}

function resetMantraTimer() {
  cancelAnimationFrame(mantraRAF);
  mantraRAF = null;

  mantraState = "idle";
  mantraStartTime = null;

  progressCircle.style.strokeDashoffset = CIRCLE_LENGTH;
  mantraBtn.textContent = "Start";
}

function hardResetAnimation() {
  cancelAnimationFrame(mantraRAF);
  mantraRAF = null;
}


/************ MANTRA setting timer ************/
function setMantraDuration(seconds) {
  MANTRA_DURATION = seconds;
  mantraDurationMs = seconds * 1000;
  localStorage.setItem("mantraDuration", seconds);

  resetMantraTimer();

  document
    .querySelectorAll(".mantra-presets button")
    .forEach(b => b.classList.remove("active"));

  document
    .querySelector(`.mantra-presets .sec${seconds === 60 ? "60" : seconds}`)
    .classList.add("active");

  progressCircle.style.stroke = MANTRA_COLORS[seconds];
}


/**** saving Mantra in MantraEditor ****/

const mantraEditor = document.getElementById("mantraEditor");

// Initialize state
function loadMantraEditor() {
  mantraEditor.value = customMantra; 
  mantraEditor.setAttribute("readonly", true);
  mantraEditor.classList.add("view-mode");
}

// "Edit on intent" - Single tap logic
mantraEditor.addEventListener("touchstart", function(e) {
  if (this.hasAttribute("readonly")) {
    // Remove readonly to allow system keyboard focus
    this.removeAttribute("readonly");
    this.classList.remove("view-mode");
    this.focus(); 
  }
}, { passive: true });

// Desktop fallback
mantraEditor.addEventListener("click", function() {
  if (this.hasAttribute("readonly")) {
    this.removeAttribute("readonly");
    this.classList.remove("view-mode");
    this.focus();
  }
});

// Re-lock after saving
function saveMantra() {
  if (!mantraEditor.value.trim()) return alert("Please enter a mantra.");

  customMantra = mantraEditor.value.trim();
  localStorage.setItem("customMantra", customMantra);
  
  loadMantraDisplay();
  
  // Re-enable "View Mode"
  mantraEditor.setAttribute("readonly", true);
  mantraEditor.classList.add("view-mode");
  alert("Mantra updated!");
}

/************ NOTES (autosave) ************/
const noteArea = document.getElementById("noteArea");
noteArea.value = localStorage.getItem("notes") || "";

noteArea.addEventListener("input", () => {
  localStorage.setItem("notes", noteArea.value);
});


/************ INIT (Run on Page Load) ************/
renderTasks();
loadMantraDisplay(); // Updates the Mantra screen
loadMantraEditor();  // Updates the Editor textarea on refresh
setMantraDuration(MANTRA_DURATION); // Sets initial color/timer

/************ THEME TOGGLE ************/
const themeBtn = document.getElementById("themeBtn");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "Light Mode";
  } else {
    document.body.classList.remove("dark");
    themeBtn.textContent = "Dark Mode";
  }
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
}

/* Load saved theme */
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

/**** for app launch ****/
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
