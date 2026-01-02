# Pure JavaScript Todo App

A todo application built with pure JavaScript, including both frontend and backend.

## Features

- ✅ Add, edit, and delete todos
- ✅ Mark todos as completed/uncompleted
- ✅ Filter todos (All, Active, Completed)
- ✅ Clear all completed todos
- ✅ Modern and responsive UI
- ✅ In-memory database (no external DB)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open in your browser:
```
http://localhost:3000
```

## Technologies

- **Backend**: Node.js + Express
- **Frontend**: Pure HTML/CSS/JavaScript
- **Database**: In-memory (array-based)

## API Endpoints

- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `DELETE /api/todos` - Delete all completed todos

