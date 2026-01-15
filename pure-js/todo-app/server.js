const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// In-memory database
let todos = [];
let nextId = 1;

// GET /api/todos - Get all todos
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// GET /api/todos/:id - Get a specific todo
app.get("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json(todo);
});

// POST /api/todos - Create a new todo
app.post("/api/todos", (req, res) => {
  const { text, completed = false } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Todo text cannot be empty" });
  }

  const newTodo = {
    id: nextId++,
    text: text.trim(),
    completed: completed,
    createdAt: new Date().toISOString(),
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id - Update a todo
app.put("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex((t) => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const { text, completed } = req.body;

  if (text !== undefined) {
    if (text.trim() === "") {
      return res.status(400).json({ error: "Todo text cannot be empty" });
    }
    todos[todoIndex].text = text.trim();
  }

  if (completed !== undefined) {
    todos[todoIndex].completed = completed;
  }

  res.json(todos[todoIndex]);
});

// DELETE /api/todos/:id - Delete a todo
app.delete("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex((t) => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }

  todos.splice(todoIndex, 1);
  res.status(204).send();
});

// DELETE /api/todos - Delete all completed todos
app.delete("/api/todos", (req, res) => {
  const initialLength = todos.length;
  todos = todos.filter((t) => !t.completed);
  const deletedCount = initialLength - todos.length;
  res.json({ deleted: deletedCount });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
