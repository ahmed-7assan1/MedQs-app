# MedOneX - Version 1.0 Documentation

## 🌌 Overview
**MedOneX** is a premium, high-performance academic ecosystem specifically designed for medical students. It integrates advanced AI intelligence, community engagement, and seamless Telegram connectivity to provide a state-of-the-art learning experience.

---

## 🚀 Core Features

### 1. Dr. Q - AI Medical Assistant
- **Intelligence**: Powered by Google Gemini 1.5 Pro/Flash.
- **Context Awareness**: Capable of analyzing lectures, PDFs, and medical queries in real-time.
- **Accessibility**: Available on the web dashboard, Telegram Bot, and the dedicated Mini App.

### 2. Premium Medical Forum (Instagram-Style)
- **Visuals**: High-fidelity "Instagram-style" mobile feed.
- **Engagement**: Like, Comment, and Share medical cases or notes.
- **Attachments**: Supports multiple images and files with direct Telegram storage integration for lightning-fast loading.
- **Privacy**: Specialized nodes for Global, Semester, and Private university groups.

### 3. Telegram Ecosystem
- **Telegram Bot**: Automated student linking via email, broadcast system, and direct resource delivery.
- **Mini App (TMA)**: A standalone, zero-login mobile experience with a Bento-style dashboard and frosted glass aesthetics.
- **Automatic Auth**: Instant identification of students via Telegram ID.

### 4. Academic Hub
- **Module Management**: Organized storage for Lectures, Notes, and Past Papers.
- **Smart Schedule**: Real-time tracking of academic tasks and objectives.
- **Gamification**: Points (pts) system, Ranks (e.g., Clinical, Resident), and Leaderboards to boost engagement.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes (Node.js runtime).
- **Database**: PostgreSQL with **Prisma ORM**.
- **Caching**: **Redis** for rate limiting, session management, and real-time pub/sub.
- **Authentication**: NextAuth.js & Telegram WebApp Verification.
- **Media**: Telegram Direct Upload & Preview API (Custom Proxy).
- **Icons**: Phosphor Icons (Pro-line aesthetics).

---

## 🎨 Design Philosophy
MedOneX follows a **"Premium Dark/Glassmorphism"** design system:
- **Bento Grids**: Modern card layouts for dashboard clarity.
- **Frosted Glass**: Backdrop blur effects for a depth-rich UI.
- **Mobile First**: Fully responsive design optimized for mobile app and Telegram webviews.
- **Phosphor Aesthetics**: Consistent use of weighted icons for a professional medical software feel.

---

## 📦 Deployment & Setup

### Environment Variables
Key variables required for V1:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `TELEGRAM_BOT_TOKEN`: The API token from BotFather.
- `NEXTAUTH_SECRET`: Security salt for sessions.
- `GEMINI_API_KEY`: Multiple keys support for AI failover.

### Installation
```bash
npm install
npx prisma generate
npm run dev
```

---

## 📅 Roadmap (Future Updates)
- Real-time video streaming proxy improvements.
- Advanced AI-powered Flashcard generation.
- Offline mode for mobile applications.
- Peer-to-peer medical case discussions.

---

**Developed with ❤️ for the Medical Community by MedOneX Team.**
