# Pure JavaScript Todo App

A todo application built with pure JavaScript, including both frontend and backend.

## Features

- ✅ Add, edit, and delete todos
- ✅ Mark todos as completed/uncompleted
- ✅ Filter todos (All, Active, Completed)
- ✅ Clear all completed todos
- ✅ Modern and responsive UI
- ✅ In-memory database (no external DB)
- ✅ OpenTelemetry tracing support

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
- **Observability**: OpenTelemetry with automated instrumentation

## OpenTelemetry Tracing

This application supports OpenTelemetry tracing using automated instrumentation via NODE_OPTIONS. No code changes are required.

### Running with OpenTelemetry

**Default (Console Exporter):**
```bash
npm run start:otel
# or for development
npm run dev:otel
```

**OTLP HTTP Exporter (for Jaeger/OTLP Collector):**
```bash
OTEL_TRACES_EXPORTER=otlp npm run start:otel
# or for development
OTEL_TRACES_EXPORTER=otlp npm run dev:otel
```

### Environment Variables

- `OTEL_SERVICE_NAME` - Service name (default: `todo-app`)
- `OTEL_TRACES_EXPORTER` - Exporter type: `console` or `otlp` (default: `console`)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP endpoint URL (default: `http://localhost:4318`)
- `OTEL_EXPORTER_OTLP_PROTOCOL` - OTLP protocol: `http/protobuf` or `http/json` (default: `http/protobuf`)

### Running Jaeger

Jaeger can be run using Docker with the provided script:

```bash
cd jaeger
./run-jaeger.sh
```

This will start Jaeger with:
- UI available at: `http://localhost:16686`
- OTLP HTTP receiver on port: `4318`
- OTLP gRPC receiver on port: `4317`

### Example: Sending traces to Jaeger

1. Start Jaeger:
```bash
cd jaeger
./run-jaeger.sh
```

2. Start the application with OTLP exporter:
```bash
OTEL_SERVICE_NAME=todo-app \
OTEL_TRACES_EXPORTER=otlp \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
npm run dev:otel
```

3. Open Jaeger UI at `http://localhost:16686` to view traces

## API Endpoints

- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `DELETE /api/todos` - Delete all completed todos

