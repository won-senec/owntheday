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
  "Seize the day!\nTake a deep breath\nand you got this";

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

/************ NOTES ************/
const noteArea = document.getElementById("noteArea");
const noteTitle = document.getElementById("noteTitle");
const archivedList = document.getElementById("archivedList");

let archivedNotes =
  JSON.parse(localStorage.getItem("archivedNotes")) || [];

// Load current note
noteArea.value = localStorage.getItem("notes") || "";
noteTitle.value = localStorage.getItem("noteTitle") || "";

// Autosave current note
noteArea.addEventListener("input", () => {
  localStorage.setItem("notes", noteArea.value);
});

noteTitle.addEventListener("input", () => {
  localStorage.setItem("noteTitle", noteTitle.value);
});

// Archive note
function archiveNote() {
  const title = noteTitle.value.trim();
  const content = noteArea.value.trim();

  if (!title && !content) {
    alert("Nothing to archive.");
    return;
  }

  archivedNotes.unshift({
    id: Date.now(),
    title: title || "Untitled",
    content,
    date: new Date().toISOString()
  });

  localStorage.setItem(
    "archivedNotes",
    JSON.stringify(archivedNotes)
  );

  noteTitle.value = "";
  noteArea.value = "";
  localStorage.removeItem("notes");
  localStorage.removeItem("noteTitle");

  renderArchivedNotes();
}

/************ ARCHIVED NOTES DRAGGING ************/
let draggedNoteIndex = null;

function renderArchivedNotes() {
  archivedList.innerHTML = "";

  archivedNotes.forEach((note, index) => {
    const li = document.createElement("li");
    li.className = "archived-item";
    li.dataset.index = index;
    li.draggable = true; // Enable native dragging

    li.innerHTML = `
      <div class="archived-info">
        <div class="archived-title">${note.title}</div>
        <div class="archived-preview">
          ${note.content ? note.content.slice(0, 60) : "No content"}
        </div>
      </div>
      <div class="archived-actions">
        <button class="open-btn" onclick="loadArchivedNote(${note.id})">Open</button>
        <button class="delete-btn" onclick="deleteArchivedNote(event, ${index})">Delete</button>
      </div>
    `;

    // Visual selection logic
    li.addEventListener("click", (e) => {
      if (e.target.tagName !== 'BUTTON') {
        document.querySelectorAll('.archived-item').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');
      }
    });

    // Add Drag & Drop Handlers
    addNoteDragHandlers(li);
    
    archivedList.appendChild(li);
  });
}

function addNoteDragHandlers(item) {
  // Desktop Dragging
  item.addEventListener("dragstart", () => {
    draggedNoteIndex = Number(item.dataset.index);
    item.classList.add("dragging");
  });

  item.addEventListener("dragover", e => e.preventDefault());

  item.addEventListener("drop", () => {
    const targetIndex = Number(item.dataset.index);
    handleNoteReorder(draggedNoteIndex, targetIndex);
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    draggedNoteIndex = null;
  });

  // Mobile Touch Dragging
  item.addEventListener("touchstart", (e) => {
    // Only drag if touching the info area, not buttons
    if (e.target.tagName !== 'BUTTON') {
      draggedNoteIndex = Number(item.dataset.index);
      item.classList.add("dragging");
    }
  }, { passive: true });

  item.addEventListener("touchmove", (e) => {
    if (draggedNoteIndex === null) return;
    e.preventDefault(); 
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetLi = target?.closest('.archived-item');
    
    if (targetLi && targetLi !== item) {
      const targetIndex = Number(targetLi.dataset.index);
      handleNoteReorder(draggedNoteIndex, targetIndex);
      draggedNoteIndex = targetIndex; 
    }
  }, { passive: false });

  item.addEventListener("touchend", () => {
    item.classList.remove("dragging");
    draggedNoteIndex = null;
  });
}

function handleNoteReorder(from, to) {
  if (from === null || from === to) return;
  const moved = archivedNotes.splice(from, 1)[0];
  archivedNotes.splice(to, 0, moved);
  localStorage.setItem("archivedNotes", JSON.stringify(archivedNotes));
  renderArchivedNotes();
}

// Add this new function to handle deletion with a popup
function deleteArchivedNote(event, index) {
  event.stopPropagation(); // Prevents the 'li' click/selection event from firing
  
  const confirmed = confirm("Delete note? Yes or No");
  if (confirmed) {
    archivedNotes.splice(index, 1);
    localStorage.setItem("archivedNotes", JSON.stringify(archivedNotes));
    renderArchivedNotes();
  }
}

// Load archived note back into editor
function loadArchivedNote(id) {
  const note = archivedNotes.find(n => n.id === id);
  if (!note) return;

  noteTitle.value = note.title;
  noteArea.value = note.content;

  localStorage.setItem("noteTitle", note.title);
  localStorage.setItem("notes", note.content);
}

// Init
renderArchivedNotes();

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

/*** Timer behavior ***/
startTime = Date.now()

duration = 60000

elapsed = Date.now() - startTime

function startMantraTimer() {
  const now = Date.now();

  localStorage.setItem("mantraStartTime", now);
  localStorage.setItem("mantraDurationMs", MANTRA_DURATION * 1000);

  mantraState = "running";
  mantraStartTime = performance.now();

  requestAnimationFrame(animateMantra);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    restoreMantraTimer();
  }
});

window.addEventListener("focus", restoreMantraTimer);

function restoreMantraTimer() {
  const start = Number(localStorage.getItem("mantraStartTime"));
  const duration = Number(localStorage.getItem("mantraDurationMs"));

  if (!start || !duration) return;

  const elapsed = Date.now() - start;

  // Timer already finished while app was backgrounded
  if (elapsed >= duration) {
    completeMantraTimer(true); // hard complete
    return;
  }

  // Resume from correct position
  mantraStartTime = performance.now() - elapsed;
  mantraState = "running";

  cancelAnimationFrame(mantraRAF);
  mantraRAF = requestAnimationFrame(animateMantra);
}

function completeMantraTimer(fromRestore = false) {
  cancelAnimationFrame(mantraRAF);
  mantraRAF = null;

  mantraState = "completed";
  localStorage.removeItem("mantraStartTime");

  progressCircle.style.transition = fromRestore ? "none" : "";
  progressCircle.style.strokeDashoffset = 0;

  mantraBtn.textContent = "Done";
}

function resetMantraTimer() {
  cancelAnimationFrame(mantraRAF);
  mantraRAF = null;

  localStorage.removeItem("mantraStartTime");
  localStorage.removeItem("mantraDurationMs");

  mantraState = "idle";
  mantraStartTime = null;

  progressCircle.style.transition = "none";
  progressCircle.style.strokeDashoffset = CIRCLE_LENGTH;

  mantraBtn.textContent = "Start";
}

