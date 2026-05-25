<div align="center">

# ⚔️ CodeBattle Arena

### Real-time Competitive Coding Platform for Developers

Transforming coding practice into live competitive battles with real-time execution, rankings, and multiplayer interaction.

<br>

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-purple?style=for-the-badge&logo=vite)
![Express](https://img.shields.io/badge/Express-5-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge&logo=socketdotio)
![Judge0](https://img.shields.io/badge/Judge0-Code%20Execution-orange?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI-38BDF8?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-pink?style=for-the-badge&logo=framer)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<br>

[🚀 Live Demo](https://code-battle-arena-codebattle-arena-psi.vercel.app/) •
[🔗 Backend API](https://codebattle-arena-yejp.onrender.com) •
[🐞 Report Bug](../../issues) •
[💡 Request Feature](../../issues)

</div>

---

# ⚡ What is CodeBattle Arena?

**CodeBattle Arena** is a production-grade competitive coding platform engineered for **real-time coding battles, live code execution, rankings, and multiplayer developer competition**.

Unlike traditional coding practice websites, CodeBattle Arena focuses on:

- Real-time coding battles
- Live code execution using Judge0
- Multiplayer interaction with Socket.IO
- Leaderboards and ranking systems
- Competitive coding experience
- Modern animated UI

Built with scalable full-stack architecture and deployed using modern cloud infrastructure.

---

# 🏆 Why CodeBattle Arena Stands Out

| Typical Coding Projects | CodeBattle Arena |
|---|---|
| Static coding UI | Real-time coding battles |
| Mock execution | Judge0 compiler integration |
| Basic frontend only | Full-stack architecture |
| No multiplayer | Socket.IO live interaction |
| Simple forms | Monaco code editor |
| Local-only | Cloud deployed production app |
| Minimal UI | Modern animated UX |

---

# ⚔️ Feature Showcase

## 💻 Live Coding Battles

- Real-time coding competitions
- Battle-based coding environment
- Competitive gameplay mechanics

---

## 🚀 Code Execution Engine

Judge0-powered execution system supporting multiple languages.

Features:

- Instant execution
- Runtime feedback
- Error handling
- Secure remote execution

---

## 🌐 Multiplayer Infrastructure

Socket.IO powers real-time communication.

Includes:

- Live updates
- Battle synchronization
- Instant state updates
- Multiplayer experience

---

## 📈 Leaderboard & Ranking System

Competitive ecosystem featuring:

- Global rankings
- Battle history
- Performance tracking
- Top coder leaderboard

---

## 🎨 Modern UI Experience

Designed with:

- TailwindCSS
- Framer Motion
- Responsive layouts
- Dark competitive aesthetic

---

# 🛠 Tech Stack

# Frontend

| Technology | Purpose |
|---|---|
| React | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Framer Motion | Animations |
| Monaco Editor | Code Editor |
| Wouter | Routing |

---

# Backend

| Technology | Purpose |
|---|---|
| Express.js | REST API |
| Socket.IO | Realtime Communication |
| Node.js | Runtime |
| Judge0 | Code Execution |
| MongoDB | Database |

---

# Deployment

| Platform | Usage |
|---|---|
| Vercel | Frontend Hosting |
| Render | Backend Hosting |
| MongoDB Atlas | Database |

---

# 🧠 System Architecture

```txt
          Frontend (Vercel)
                  │
                  ▼
     React + Monaco + Socket.IO
                  │
                  ▼
        Express API (Render)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   MongoDB Atlas       Judge0 API
        │                   │
        ▼                   ▼
 User Data         Code Compilation
```

---

# 📂 Project Structure

```txt
CodeBattle-Arena/
│
├── artifacts/
│   ├── codebattle-arena/     # Frontend
│   └── api-server/           # Backend
│
├── lib/
│   ├── db/                   # Database logic
│   ├── api-client-react/     # API client
│   └── api-zod/              # Validation schemas
│
├── scripts/
│
├── package.json
├── pnpm-workspace.yaml
└── vercel.json
```

---

# 📸 Screenshots

## Home Page

Add screenshot here

```md
![Home](screenshots/home.png)
```

---

## Battle Arena

```md
![Battle](screenshots/battle.png)
```

---

## Leaderboard

```md
![Leaderboard](screenshots/leaderboard.png)
```

---

## Code Editor

```md
![Editor](screenshots/editor.png)
```

---

# 🔌 API Overview

## Stats

```http
GET /api/stats/overview
```

Returns:

- Total users
- Battles
- Submissions
- Problems
- Active battles

---

## Battles

```http
GET /api/battles/active
```

Returns currently active battles.

---

## Submission

```http
POST /api/submission
```

Handles code execution requests.

---

# ⚙️ Local Setup

## 1 Clone Repository

```bash
git clone https://github.com/Jyotiiii3003/CodeBattle-Arena.git
```

```bash
cd CodeBattle-Arena
```

---

## 2 Install Dependencies

Using pnpm:

```bash
pnpm install
```

---

## 3 Configure Environment Variables

Create:

```bash
.env
```

Example:

```env
MONGODB_URI=your_mongodb_uri
JUDGE0_URL=your_judge0_url
JWT_SECRET=your_secret
PORT=5000
```

---

## 4 Run Project

Frontend:

```bash
pnpm run dev
```

Backend:

```bash
pnpm run start
```

---

# 🚀 Deployment

Frontend:

- Vercel

Backend:

- Render

Database:

- MongoDB Atlas

---

# 🗺 Roadmap

Future improvements planned:

- AI coding assistant
- Matchmaking ELO system
- Team battles
- Battle replay system
- Analytics dashboard
- Profile achievements
- Challenge tournaments

---

# 🤝 Contributing

Contributions are welcome.

Steps:

1 Fork repository

2 Create feature branch

```bash
git checkout -b feature-name
```

3 Commit changes

```bash
git commit -m "Add feature"
```

4 Push branch

```bash
git push origin feature-name
```

5 Open Pull Request

---

# 📜 License

Distributed under the MIT License.

---

# 👨‍💻 Author

### Jyoti Mishra

GitHub:

https://github.com/Jyotiiii3003

---

<div align="center">

### ⚔️ Enter the Arena. Code. Compete. Conquer.

</div>
