// API Base URL
const API_BASE = "/api/todos";

// DOM Elements
const totalAdded = document.getElementById("totalAdded");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const completionRate = document.getElementById("completionRate");
const historyList = document.getElementById("historyList");

// Fetch and display history
async function loadHistory() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error("Failed to load todos");
    const todos = await response.json();

    const total = todos.length;
    const active = todos.filter((t) => !t.completed).length;
    const completed = todos.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalAdded.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    completionRate.textContent = `${rate}%`;

    // Display history list
    historyList.innerHTML = "";
    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `history-item ${todo.completed ? "completed" : "active"}`;
      li.innerHTML = `
                <span class="history-text">${escapeHtml(todo.text)}</span>
                <span class="history-status">${
                  todo.completed ? "Completed" : "Active"
                }</span>
            `;
      historyList.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading history:", error);
    showError("An error occurred while loading history");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  alert(message);
}

// Initialize
loadHistory();
