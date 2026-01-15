# 🚀 GitHubWhisper - GitHub Analytics & AI Chatbot Platform

<div align="center">

<img src="./GithubWhisper/frontend/public/favicon.svg" width="64" height="64" alt="GitHubWhisper Logo" />

**A comprehensive GitHub analytics platform with AI-powered insights and chatbot**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3+-FF6B6B?logo=langchain)](https://www.langchain.com/)

[Features](#-features) • [Getting Started](#-getting-started) • [Backend](#-backend) • [Frontend](#-frontend) • [Tech Stack](#-tech-stack)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Backend](#-backend)
- [Frontend](#-frontend)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Configuration](#-api-configuration)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**GitHubWhisper** is a modern, feature-rich GitHub analytics platform that provides deep insights into developer profiles, coding habits, repository statistics, and AI-powered chatbot assistance. The platform consists of two main components:

- **Frontend**: A React-based web application with advanced analytics visualizations
- **Backend**: A FastAPI server with LangChain/LangGraph-powered AI chatbot using GitHub MCP

### What Makes GitHubWhisper Special?

- 🔍 **Intelligent User Search** - Real-time autocomplete with GitHub user suggestions
- 📊 **Advanced Analytics** - Bus factor analysis, health scores, stress detection, and more
- 🤖 **AI-Powered Chatbot** - Context-aware assistant powered by LangChain and GitHub MCP
- 📈 **3D Visualizations** - Interactive repository galaxy and commit timeline visualizations
- 🌓 **Dark/Light Mode** - Seamless theme switching with system preference detection
- ⚡ **Performance Optimized** - Efficient data fetching with TanStack Query caching

---

## ✨ Features

### 🔎 User Search & Discovery
- **Autocomplete Search**: Real-time GitHub user suggestions as you type
- **User Profile Cards**: Comprehensive profile information with avatar, bio, stats, and social links
- **Quick Access**: Direct links to user's Twitter, blog, and GitHub profile

### 📈 Advanced Analytics & Insights

#### Dashboard Analytics
- **Monthly Commit Graph**: Interactive area chart showing commit trends over the last 12 months
- **Time-based Analysis**: Breakdown of commits by month with visual representation
- **Historical Data**: Track coding activity patterns over time

#### Coding Habits Analysis
- **🌙 Night Coder Detection**: Identifies developers who code primarily during night hours (22:00-03:00)
- **☀️ Day Coder Detection**: Identifies developers who code primarily during day hours (04:00-21:00)
- **Percentage Breakdown**: Visual representation of night vs. day coding percentages
- **Commit Statistics**: Total commits analyzed with detailed breakdowns

#### Stress & Panic Code Detection
- **Stress Score Analysis**: Detects stressful coding patterns based on commit messages and timing
- **Panic Indicators**: Identifies commits with stress keywords (fix, urgent, hotfix, etc.)
- **Night Aggressive Coding**: Detects late-night coding sessions with high file changes
- **Weekly Stress Trends**: Visual tracking of stress levels over time
- **Stress Breakdown**: Analysis by time of day and commit type

#### Bus Factor Analysis
- **Risk Assessment**: Identifies repositories with high bus factor risk (over 60% commits from single contributor)
- **Contributor Distribution**: Visual representation of commit distribution across contributors
- **Global Bus Factor**: Overall bus factor metrics across all repositories
- **Risk Categorization**: LOW, MEDIUM, HIGH risk classification

#### Repository Health Scores
- **Health Metrics**: Calculates repository health based on issue resolution and PR merge rates
- **Merge Time Analysis**: Tracks average PR merge times
- **Health Grades**: EXCELLENT, GOOD, FAIR, POOR health classifications
- **Global Health Score**: Overall health metrics across repositories

#### Language Statistics
- **Top Languages**: Displays the top 3 most used programming languages
- **Usage Percentages**: Percentage breakdown of language usage across repositories
- **Byte Counts**: Total bytes written in each language

#### Analytics Page Features
- **3D Repository Galaxy**: Interactive 3D visualization of repositories with stars, forks, and contributors
- **Commit Timeline**: D3.js-powered timeline visualization of commit activity
- **Bus Factor Donut Charts**: Visual representation of contributor distribution
- **Health Gauge Charts**: Repository health score visualization
- **Commit Tree**: Tree visualization of commit history
- **Insights Panel**: AI-generated insights with actionable recommendations
- **View Modes**: Toggle between Galaxy, Timeline, and Overview modes

### 📦 Repository Management
- **Top 20 Repositories**: List of most recently updated public repositories
- **Repository Details**: Stars, forks, language, description, and last update information
- **Sortable Table**: Interactive table with sorting and filtering capabilities

### 🤖 AI Chatbot Assistant (Backend)
- **Interactive Q&A**: Ask questions about GitHub repositories, code, issues, and more
- **Context-Aware Responses**: Understands org/repo/branch context
- **GitHub MCP Integration**: Direct access to GitHub API through Model Context Protocol
- **Streaming Responses**: Real-time SSE (Server-Sent Events) streaming
- **Thread Management**: Conversation threads with persistent memory
- **State Management**: Tracks active organization, repository, and branch context

### 🎨 User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Loading States**: Skeleton loaders for smooth user experience
- **Error Handling**: Graceful error messages with helpful suggestions
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Command Menu**: Quick navigation with Cmd/Ctrl+K shortcut

### 🧭 Navigation
- **Sidebar Navigation**: Easy access to different sections
- **Route Management**: React Router for seamless page navigation
- **Active State Indicators**: Visual feedback for current page
- **Quick Actions**: Fast access to dashboard and chat features
- **Pages**: Dashboard, Branches, Analytics, Organizations, Projects, Team

---

## 🚀 Getting Started

### Prerequisites

**For Frontend:**
- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** >= 1.22.x
- **GitHub Personal Access Token** (optional, for higher API rate limits)

**For Backend:**
- **Python** >= 3.11
- **pip** or **uv**
- **OpenAI API Key** (required for chatbot)
- **GitHub Personal Access Token** (required for GitHub MCP)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/browser-devtools-mcp-demo.git
   cd browser-devtools-mcp-demo
   ```

2. **Set up Backend** (see [Backend](#-backend) section)
3. **Set up Frontend** (see [Frontend](#-frontend) section)

---

## 🔧 Backend

The backend is a FastAPI server that provides an AI-powered chatbot using LangChain, LangGraph, and GitHub MCP.

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd GithubWhisper/backend
   ```

2. **Create virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   # or using uv
   uv pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `GithubWhisper/backend` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GITHUB_PAT=your_github_personal_access_token_here
   PORT=3000
   ```
   
   > 💡 **Note**: 
   > - `OPENAI_API_KEY`: Required for the AI chatbot (get from [OpenAI](https://platform.openai.com/api-keys))
   > - `GITHUB_PAT`: Required for GitHub MCP access (create at GitHub Settings → Developer settings → Personal access tokens)
   > - `PORT`: Optional, defaults to 3000

5. **Run the server**
   ```bash
   # Using Python module
   python -m src.main
   
   # Or using the CLI mode
   python -m src.main --cli
   ```

   The server will start at `http://localhost:3000`

### Backend API Endpoints

- `GET /health` - Health check endpoint
- `POST /chat` - Chat endpoint with SSE streaming
  - Request body: `{ "threadId": string, "message": string }`
  - Response: Server-Sent Events stream

### Backend Features

- **LangGraph Agent**: Stateful conversation agent with memory
- **GitHub MCP Integration**: Direct access to GitHub API through Model Context Protocol
- **Context Management**: Tracks active organization, repository, and branch
- **Streaming Responses**: Real-time SSE streaming for chat responses
- **Error Handling**: Graceful error handling with retry logic
- **Tool Retry**: Automatic retry for tool call failures

### Backend Tech Stack

- **FastAPI** - Modern, fast web framework
- **LangChain** - LLM application framework
- **LangGraph** - Stateful agent orchestration
- **LangChain MCP Adapters** - GitHub MCP integration
- **OpenAI** - GPT-4.1-mini for chat and state extraction
- **Uvicorn** - ASGI server
- **SSE Starlette** - Server-Sent Events support

---

## 🎨 Frontend

The frontend is a React-based web application with advanced analytics visualizations.

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd GithubWhisper/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables** (Optional)
   
   Create a `.env` file in the `GithubWhisper/frontend` directory:
   ```env
   VITE_GITHUB_TOKEN=your_github_personal_access_token_here
   VITE_CHATBOT_API_URL=http://localhost:3000
   ```
   
   > 💡 **Note**: 
   > - `VITE_GITHUB_TOKEN`: Optional, for higher API rate limits (5,000 vs 60 requests/hour)
   > - `VITE_CHATBOT_API_URL`: Backend chatbot API URL (defaults to http://localhost:3000)

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Frontend Features

- **Dashboard Page**: User profile, commit analytics, coding habits, repository list
- **Analytics Page**: 3D visualizations, bus factor analysis, health scores, insights
- **Branches Page**: Repository branch management
- **Organizations Page**: GitHub organization management
- **Projects Page**: Project management
- **Team Page**: Team collaboration features
- **AI Chatbot**: Integrated chatbot interface connected to backend

### Frontend Tech Stack

- **React 19.2.0** - UI library with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.4** - Lightning-fast build tool
- **React Router 7.11.0** - Client-side routing
- **TanStack Query 5.90.16** - Powerful data synchronization
- **Shadcn UI** - Beautiful, accessible components
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Tabler Icons** - 4,000+ free icons
- **Recharts 2.15.4** - Composable charting library
- **D3.js** - Data visualization library
- **Three.js / React Three Fiber** - 3D visualizations
- **next-themes** - Theme management
- **Zod** - TypeScript-first schema validation
- **Sonner** - Toast notifications

---

## 🛠️ Tech Stack

### Backend Technologies
- **Python 3.11+** - Programming language
- **FastAPI** - Web framework
- **LangChain** - LLM framework
- **LangGraph** - Agent orchestration
- **OpenAI GPT-4.1-mini** - LLM model
- **GitHub MCP** - Model Context Protocol for GitHub
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **python-dotenv** - Environment variable management

### Frontend Technologies
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.4** - Build tool
- **TanStack Query** - Data fetching
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **D3.js** - Data visualization
- **Three.js** - 3D graphics
- **Recharts** - Charts

---

## 📁 Project Structure

```
browser-devtools-mcp-demo/
├── GithubWhisper/
│   ├── backend/                    # Backend API server
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── main.py            # Entry point
│   │   │   ├── server.py          # FastAPI server
│   │   │   ├── agent.py            # LangGraph agent
│   │   │   └── cli.py              # CLI interface
│   │   ├── pyproject.toml          # Python project config
│   │   └── requirements.txt        # Python dependencies
│   │
│   └── frontend/                   # React frontend application
│       ├── public/                 # Static assets
│       ├── src/
│       │   ├── components/         # React components
│       │   │   ├── ui/             # Shadcn UI components
│       │   │   ├── d3/             # D3.js visualizations
│       │   │   ├── three/          # Three.js visualizations
│       │   │   ├── app-sidebar.tsx
│       │   │   ├── search-github-user.tsx
│       │   │   ├── github-chatbot.tsx
│       │   │   ├── stress-analyzer.tsx
│       │   │   └── ...
│       │   ├── pages/              # Page components
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── AnalyticsPage.tsx
│       │   │   ├── BranchesPage.tsx
│       │   │   └── ...
│       │   ├── analytics/           # Analytics modules
│       │   │   ├── busFactor.ts
│       │   │   ├── healthScore.ts
│       │   │   ├── insights.ts
│       │   │   └── commitStats.ts
│       │   ├── api/                # API clients
│       │   │   └── github.ts
│       │   ├── hooks/              # Custom hooks
│       │   ├── lib/                # Utilities
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
│
└── README.md                       # This file
```

---

## 🔧 API Configuration

### GitHub API Rate Limits

| Authentication | Rate Limit |
|---------------|------------|
| Unauthenticated | 60 requests/hour |
| Authenticated | 5,000 requests/hour |

### Setting Up GitHub Token

1. **Create a Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `public_repo` scope

2. **Add to Environment Variables**
   
   **Frontend** (`.env` in `GithubWhisper/frontend`):
   ```env
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```
   
   **Backend** (`.env` in `GithubWhisper/backend`):
   ```env
   GITHUB_PAT=ghp_your_token_here
   ```

3. **Restart the Development Server**

### API Endpoints Used

**Backend API:**
- `GET /health` - Health check
- `POST /chat` - Chat endpoint with SSE streaming

---

## 🧪 Development

### Frontend Development

```bash
cd GithubWhisper/frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Development

```bash
cd GithubWhisper/backend

# Run server
python -m src.main

# Run CLI mode
python -m src.main --cli

# Install dev dependencies
pip install -e ".[dev]"

# Run tests (if available)
pytest
```

### Code Style

**Frontend:**
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** (if configured) for code formatting

**Backend:**
- **Black** for code formatting
- **Ruff** for linting
- **MyPy** for type checking

### Best Practices

- ✅ Use TypeScript/Python type hints for all new files
- ✅ Follow React Hooks best practices
- ✅ Use TanStack Query for all API calls
- ✅ Implement loading and error states
- ✅ Make components accessible (ARIA labels, keyboard navigation)
- ✅ Write descriptive commit messages
- ✅ Add docstrings to Python functions

---

## 📖 Usage Guide

### Searching for a GitHub User

1. **Enter a username** in the search box
2. **Select from suggestions** that appear as you type
3. **View the profile** - All analytics will load automatically

### Understanding the Analytics

#### Dashboard Page
- **User Profile Card**: Avatar, name, bio, stats, and social links
- **Coder Type Card**: Shows whether the user is a Night Coder or Daily Coder
- **Night/Day Coding Cards**: Percentage breakdown of commits by time of day
- **Top Language Card**: Most used programming language
- **Monthly Commits Chart**: Interactive area chart showing commit activity
- **Repository Table**: Sortable table of top 20 repositories
- **Stress Analyzer**: Detects stressful coding patterns and panic commits

#### Analytics Page
- **3D Repository Galaxy**: Interactive 3D visualization (drag to rotate, scroll to zoom)
- **Commit Timeline**: D3.js timeline showing commit activity over time
- **Bus Factor Donut Charts**: Visual representation of contributor distribution
- **Health Gauge Charts**: Repository health score visualization
- **Commit Tree**: Tree visualization of commit history
- **Insights Panel**: AI-generated insights with actionable recommendations
- **View Modes**: Toggle between Galaxy, Timeline, and Overview modes

### Using the Chatbot

1. **Start the backend server** (see [Backend](#-backend) section)
2. **Click the chat icon** in the bottom-right corner (or use sidebar navigation)
3. **Select a GitHub user** first (if not already selected)
4. **Ask questions** like:
   - "What programming languages does this user use?"
   - "Is this user a night coder or day coder?"
   - "Tell me about their coding habits"
   - "What are their top repositories?"
   - "Show me commits from the main branch"
   - "What issues are open in this repository?"

### Navigation

- **Dashboard**: Main analytics page (default)
- **Branches**: Repository branch management
- **Analytics**: Advanced analytics with 3D visualizations
- **Organizations**: GitHub organization management
- **Projects**: Project management
- **Team**: Team collaboration features
- **Chat**: Open the AI chatbot

### Theme Switching

- Click the **theme toggle** in the header
- Choose from:
  - ☀️ Light mode
  - 🌙 Dark mode
  - 💻 System preference (default)

### Command Menu

- Press **Cmd/Ctrl+K** to open the command menu
- Search for pages, components, and features
- Navigate quickly to any section

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features (if applicable)
- Update documentation as needed
- Ensure all tests pass before submitting
- Use TypeScript/Python type hints
- Write descriptive commit messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GitHub** for providing the comprehensive API
- **OpenAI** for the powerful LLM models
- **LangChain** for the excellent LLM framework
- **Shadcn UI** for the beautiful component library
- **TanStack** for the excellent data fetching library
- **Vite** team for the amazing build tool
- **React** team for the powerful UI library
- **D3.js** and **Three.js** communities for visualization libraries

---

## 📞 Support

For support, open an issue in the repository.

---

<div align="center">

**Made with ❤️ by the GithubWhisper Team**

</div>
