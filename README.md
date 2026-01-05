# 🚀 Thundra - GitHub Analytics Dashboard

<div align="center">

![Logo](./react-app/public/favicon.svg)

**A comprehensive GitHub user analytics platform with AI-powered insights**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vitejs.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5.90.16-FF4154?logo=react-query)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.18-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Usage](#-usage)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [API Configuration](#-api-configuration)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Coding Analyze** is a modern, feature-rich GitHub analytics dashboard that provides deep insights into developer profiles, coding habits, and repository statistics. Built with cutting-edge web technologies, it offers an intuitive interface for analyzing GitHub users' activity patterns, commit history, programming language preferences, and more.

### What Makes Thundra Special?

- 🔍 **Intelligent User Search** - Real-time autocomplete with GitHub user suggestions
- 📊 **Comprehensive Analytics** - Visualize commit patterns, coding habits, and language usage
- 🤖 **AI-Powered Chatbot** - Interactive assistant for profile-related questions
- 🌓 **Dark/Light Mode** - Seamless theme switching with system preference detection
- ⚡ **Performance Optimized** - Efficient data fetching with TanStack Query caching
- 🎨 **Modern UI/UX** - Built with Shadcn UI components for a polished experience

---

## ✨ Features

### 🔎 User Search & Discovery
- **Autocomplete Search**: Real-time GitHub user suggestions as you type
- **User Profile Cards**: Comprehensive profile information with avatar, bio, stats, and social links
- **Quick Access**: Direct links to user's Twitter, blog, and GitHub profile

### 📈 Analytics & Insights

#### Commit Activity Visualization
- **Monthly Commit Graph**: Interactive area chart showing commit trends over the last 12 months
- **Time-based Analysis**: Breakdown of commits by month with visual representation
- **Historical Data**: Track coding activity patterns over time

#### Coding Habits Analysis
- **🌙 Night Coder Detection**: Identifies developers who code primarily during night hours (22:00-03:00)
- **☀️ Day Coder Detection**: Identifies developers who code primarily during day hours (04:00-21:00)
- **Percentage Breakdown**: Visual representation of night vs. day coding percentages
- **Commit Statistics**: Total commits analyzed with detailed breakdowns

#### Language Statistics
- **Top Languages**: Displays the top 3 most used programming languages
- **Usage Percentages**: Percentage breakdown of language usage across repositories
- **Byte Counts**: Total bytes written in each language

### 📦 Repository Management
- **Top 20 Repositories**: List of most recently updated public repositories
- **Repository Details**: Stars, forks, language, description, and last update information
- **Sortable Table**: Interactive table with sorting and filtering capabilities

### 🤖 AI Chatbot Assistant
- **Interactive Q&A**: Ask questions about the GitHub user's profile
- **Context-Aware Responses**: Understands coding stats, languages, and profile information
- **Real-time Chat**: Smooth chat interface with message history
- **Smart Suggestions**: Helpful prompts for common questions

### 🎨 User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Loading States**: Skeleton loaders for smooth user experience
- **Error Handling**: Graceful error messages with helpful suggestions
- **Accessibility**: WCAG compliant with keyboard navigation support

### 🧭 Navigation
- **Sidebar Navigation**: Easy access to different sections
- **Route Management**: React Router for seamless page navigation
- **Active State Indicators**: Visual feedback for current page
- **Quick Actions**: Fast access to dashboard and chat features

---

## 📸 Screenshots

### Dashboard View
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search GitHub User                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Search input with autocomplete dropdown]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👤 User Profile Card                            │   │
│  │  Avatar | Name | Bio | Stats | Social Links     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ Coder│ │ Night│ │ Day  │ │ Top  │                │
│  │ Type │ │ Coding│ │Coding│ │Lang  │                │
│  └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 Monthly Commits Chart                       │   │
│  │  [Interactive Area Chart]                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📦 Top 20 Repositories                         │   │
│  │  [Sortable Table]                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Feature Highlights
- **🎯 Smart Search**: Type-ahead suggestions with user avatars
- **📊 Visual Analytics**: Beautiful charts and graphs
- **🌓 Theme Toggle**: Seamless dark/light mode switching
- **💬 Chat Interface**: AI-powered chatbot in a slide-out panel

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** >= 1.22.x
- **GitHub Personal Access Token** (optional, for higher API rate limits)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/browser-devtools-mcp-demo.git
   cd browser-devtools-mcp-demo
   ```

2. **Navigate to the React app**
   ```bash
   cd react-app
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Configure environment variables** (Optional)
   
   Create a `.env` file in the `react-app` directory:
   ```env
   VITE_GITHUB_TOKEN=your_github_personal_access_token_here
   ```
   
   > 💡 **Note**: Without a token, you'll have a lower API rate limit (60 requests/hour). With authentication, you get 5,000 requests/hour.

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

---

## 🛠️ Tech Stack

### Core Technologies
- **[React 19.2.0](https://react.dev/)** - UI library with latest features
- **[TypeScript 5.9.3](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite 7.2.4](https://vitejs.dev/)** - Lightning-fast build tool
- **[React Router 7.11.0](https://reactrouter.com/)** - Client-side routing

### State Management & Data Fetching
- **[TanStack Query 5.90.16](https://tanstack.com/query)** - Powerful data synchronization
- **React Hooks** - Modern state management

### UI Framework & Components
- **[Shadcn UI](https://ui.shadcn.com/)** - Beautiful, accessible components
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible primitives
- **[Tailwind CSS 4.1.18](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Tabler Icons](https://tabler.io/icons)** - 4,000+ free icons

### Data Visualization
- **[Recharts 2.15.4](https://recharts.org/)** - Composable charting library

### Additional Libraries
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting rules

---

## 📁 Project Structure

```
browser-devtools-mcp-demo/
├── react-app/                    # Main React application
│   ├── public/                   # Static assets
│   │   ├── favicon.svg           # Application favicon
│   │   └── logo.svg              # logo
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── app-sidebar.tsx  # Main sidebar navigation
│   │   │   ├── search-github-user.tsx  # Core search component
│   │   │   ├── chart-area-interactive.tsx  # Commit chart
│   │   │   ├── repo-table.tsx   # Repository table
│   │   │   ├── github-chatbot.tsx  # AI chatbot
│   │   │   └── ...              # Other components
│   │   ├── pages/               # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LifecyclePage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── TeamPage.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Application entry point
│   ├── package.json            # Dependencies
│   └── vite.config.ts          # Vite configuration
└── README.md                   # This file
```

---

## 📖 Usage Guide

### Searching for a GitHub User

1. **Enter a username** in the search box
2. **Select from suggestions** that appear as you type
3. **View the profile** - All analytics will load automatically

### Understanding the Analytics

#### Coder Type Card
- Shows whether the user is a **Night Coder** or **Daily Coder**
- Based on commit time analysis (22:00-03:00 for night, 04:00-21:00 for day)
- Displays the dominant coding pattern percentage

#### Night/Day Coding Cards
- **Night Coding**: Percentage of commits made between 22:00-03:00
- **Day Coding**: Percentage of commits made between 04:00-21:00
- Shows total commit counts for each period

#### Top Language Card
- Displays the most used programming language
- Shows usage percentage and total bytes across repositories

#### Monthly Commits Chart
- Interactive area chart showing commit activity
- Always displays the last 12 months of data when available
- Hover over data points for detailed information

#### Repository Table
- Lists the top 20 most recently updated public repositories
- Sortable columns: Name, Description, Language, Stars, Forks, Last Updated
- Click repository names to open on GitHub

### Using the Chatbot

1. **Click the chat icon** in the bottom-right corner (or use sidebar navigation)
2. **Select a GitHub user** first (chatbot requires a user to be selected)
3. **Ask questions** like:
   - "What programming languages does this user use?"
   - "Is this user a night coder or day coder?"
   - "Tell me about their coding habits"
   - "What are their top repositories?"

### Navigation

- **Dashboard**: Main analytics page (default)
- **Lifecycle**: Lifecycle management (coming soon)
- **Analytics**: Advanced analytics (coming soon)
- **Projects**: Project management (coming soon)
- **Team**: Team collaboration (coming soon)
- **Chat**: Open the AI chatbot

### Theme Switching

- Click the **theme toggle** in the header
- Choose from:
  - ☀️ Light mode
  - 🌙 Dark mode
  - 💻 System preference (default)

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
   ```env
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```

3. **Restart the Development Server**
   ```bash
   npm run dev
   ```

### API Endpoints Used

- `GET /users/{username}` - User profile information
- `GET /search/users` - User search with autocomplete
- `GET /users/{username}/repos` - User repositories
- `GET /repos/{owner}/{repo}/stats/commit_activity` - Commit activity
- `GET /repos/{owner}/{repo}/stats/punch_card` - Commit punch card
- `GET /repos/{owner}/{repo}/languages` - Repository languages

---

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Code Style

- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** (if configured) for code formatting

### Best Practices

- ✅ Use TypeScript for all new files
- ✅ Follow React Hooks best practices
- ✅ Use TanStack Query for all API calls
- ✅ Implement loading and error states
- ✅ Make components accessible (ARIA labels, keyboard navigation)
- ✅ Optimize images and assets
- ✅ Write descriptive commit messages

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
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GitHub** for providing the comprehensive API
- **Shadcn UI** for the beautiful component library
- **TanStack** for the excellent data fetching library
- **Vite** team for the amazing build tool
- **React** team for the powerful UI library

---

## 📞 Support

For support open an issue in the repository.

---

<div align="center">

**Made with ❤️ by the T Team**


</div>
