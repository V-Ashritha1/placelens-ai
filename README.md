<div align="center">

# 🎯 PlaceLens AI

### AI-Powered Resume Analysis & Career Readiness Platform

**Empowering students to land their dream internships with AI-driven resume insights, job-fit analysis, and personalized career guidance.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](#)
[![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=flat-square&logo=railway)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](#)
[![Stars](github/stars/V-Ashritha1/placelens-ai?style=flat-square)](#)

<br />

[🚀 Live Demo](#) · [📚 API Docs](#) · [🐛 Report Bug](#) · [✨ Request Feature](#)

</div>

---

## 📖 Table of Contents

- [Demo](#-demo)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Folder Structure](#-folder-structure)
- [Future Improvements](#-future-improvements)
- [License](#-license)
- [Author](#-author)

---

## 🌐 Demo

| Resource | Link |
|----------|------|
| 🖥️ **Live Demo** | https://placelens-ai-two.vercel.app |
| 📦 **GitHub Repository** | https://github.com/V-Ashritha1/placelens-ai |

---

## ✨ Features

### 🔐 Authentication & User Management
- 👤 **User Registration & Login** — Seamless onboarding with form validation
- 🔒 **Secure JWT Authentication** — Stateless, token-based session security
- 🧾 **User Profile** — Manage personal and academic details in one place

### 📄 Resume Management
- ⬆️ **Resume Upload (PDF)** — Fast, drag-and-drop resume uploads
- 🗂️ **Resume Management Suite**
  - 👁️ **View** — Preview resumes instantly in-browser
  - ⬇️ **Download** — Export resumes anytime
  - ✏️ **Rename** — Organize resumes with custom names
  - 🗑️ **Delete** — Remove outdated versions
  - ⭐ **Set Default Resume** — Mark your primary resume for quick analysis

### 🤖 AI-Powered Career Intelligence
- 📊 **ATS Resume Analysis** — Get an Applicant Tracking System compatibility score with actionable fixes
- 🎯 **Job Description Matching** — Compare your resume against any JD to measure fit
- 🧩 **Skill Gap Analysis** — Instantly identify missing skills for your target role
- 💡 **AI Personalized Recommendations** — Tailored suggestions powered by Google Gemini
- ✅ **Internship Eligibility Checker** — Know instantly if you qualify for a role based on criteria

### 📈 Platform Experience
- 🧮 **Dashboard with Analytics** — Visualize resume performance and application readiness
- 🔔 **Notifications** — Stay updated on analysis results and recommendations
- 🔍 **Search & Filter** — Quickly locate resumes, reports, and insights
- 📱 **Responsive UI** — Optimized experience across desktop, tablet, and mobile
- ☁️ **Cloud Deployed** — Frontend on **Vercel**, Backend on **Railway**

---


## 🖼️ Screenshots

<details open>
<summary><strong>Click to expand / collapse screenshots</strong></summary>

<br />

| Login | Dashboard |
|:---:|:---:|
| ![Login Screenshot](docs/login.png) | ![Dashboard Screenshot](docs/dashboard.png) |

| Resume Upload | ATS Report |
|:---:|:---:|
| ![Resume Upload](docs/resume-upload.png) | ![ATS Report](docs/ats-report.png) |

| JD Matcher | Skill Gap Analysis |
|:---:|:---:|
| ![JD Matcher](docs/jd-matcher.png) | ![Skill Gap](docs/skill-gap.png) |

| Eligibility Checker | Profile |
|:---:|:---:|
| ![Eligibility Checker](docs/eligibility-checker.png) | ![Profile](docs/profile.png) |

</details>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework for SSR/SSG and routing |
| **React** | Component-driven UI library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible, reusable UI components |
| **Axios** | HTTP client for API communication |

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **Python** | Core backend language |
| **SQLAlchemy** | ORM for database interaction |
| **PostgreSQL** | Relational database |
| **Alembic** | Database migrations |
| **JWT Authentication** | Secure token-based auth |

### AI

| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | Resume analysis, JD matching & recommendations |

</div>

---

## 🏗️ Architecture

PlaceLens AI follows a **decoupled, service-oriented architecture**:

1. **Next.js (Frontend)** — Handles the UI/UX, authentication flows, and dashboard rendering. Communicates with the backend via REST API calls using Axios.
2. **FastAPI (Backend)** — Exposes RESTful endpoints, handles business logic, JWT authentication, and orchestrates requests to the database and AI layer.
3. **PostgreSQL (Database)** — Stores user data, resumes, analysis history, and eligibility records, managed through SQLAlchemy ORM with Alembic migrations.
4. **Google Gemini API (AI Layer)** — Processes resume text and job descriptions to generate ATS scores, skill gap insights, and personalized recommendations, which are returned to the backend and rendered on the frontend.

```mermaid
flowchart LR
    A[👨‍🎓 User Browser] -->|HTTPS| B[Next.js Frontend<br/>Vercel]
    B -->|REST API / Axios| C[FastAPI Backend<br/>Railway]
    C -->|SQLAlchemy ORM| D[(PostgreSQL Database)]
    C -->|Resume + JD Text| E[Google Gemini API]
    E -->|AI Insights| C
    C -->|JSON Response| B
    B -->|Rendered UI| A

    style A fill:#4F46E5,color:#fff
    style B fill:#000000,color:#fff
    style C fill:#009688,color:#fff
    style D fill:#4169E1,color:#fff
    style E fill:#8E75B2,color:#fff
```

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/V-Ashritha1/placelens-ai
cd placelens-ai
```

<details>
<summary><strong>2️⃣ Frontend Setup</strong></summary>

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Add NEXT_PUBLIC_API_URL to .env.local

# Run the development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

</details>

<details>
<summary><strong>3️⃣ Backend Setup</strong></summary>

```bash
cd placelens-backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Add DATABASE_URL, SECRET_KEY, ALGORITHM,
# ACCESS_TOKEN_EXPIRE_MINUTES, GOOGLE_API_KEY to .env

# Run database migrations
alembic upgrade head

# Run the backend server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

</details>

---

## 🔑 Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`.env`)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/placelens_db
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_API_KEY=your_google_gemini_api_key
```

> ⚠️ **Never commit your `.env` files.** Use `.env.example` as a reference template.

---

## 📡 API Endpoints

<details open>
<summary><strong>Click to expand / collapse full API reference</strong></summary>

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout current user |

### 📄 Resume

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/resume/upload` | Upload a new resume (PDF) |
| `GET` | `/api/resume/` | Get all resumes for the user |
| `GET` | `/api/resume/{id}` | View a specific resume |
| `GET` | `/api/resume/{id}/download` | Download a resume |
| `PUT` | `/api/resume/{id}/rename` | Rename a resume |
| `PUT` | `/api/resume/{id}/set-default` | Set resume as default |
| `DELETE` | `/api/resume/{id}` | Delete a resume |

### 📊 ATS Analysis

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/ats/analyze` | Run ATS analysis on a resume |
| `GET` | `/api/ats/history` | Get past ATS analysis reports |

### 🎯 JD Matcher

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/jd-matcher/match` | Match resume against a job description |
| `GET` | `/api/jd-matcher/history` | Get past JD match reports |

### 🧩 Skill Gap

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/skill-gap/analyze` | Analyze skill gaps for a target role |
| `GET` | `/api/skill-gap/history` | Get past skill gap reports |

### ✅ Eligibility

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/eligibility/check` | Check internship eligibility |
| `GET` | `/api/eligibility/history` | Get past eligibility check results |

### 🧾 Profile

| Method | Endpoint | Description |
|--------|----------|--------------|
| `GET` | `/api/profile/` | Get current user profile |
| `PUT` | `/api/profile/` | Update user profile |
| `DELETE` | `/api/profile/` | Delete user account |

</details>

---

## 📂 Folder Structure

<details>
<summary><strong>Frontend Structure</strong></summary>

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── resume/
│   │   ├── upload/
│   │   └── manage/
│   ├── ats-report/
│   ├── jd-matcher/
│   ├── skill-gap/
│   ├── eligibility/
│   ├── profile/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── forms/
│   ├── dashboard/
│   └── shared/
├── lib/
│   ├── axios.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
├── types/
├── public/
├── styles/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

</details>

<details>
<summary><strong>Backend Structure</strong></summary>

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── resume.py
│   │   │   ├── ats.py
│   │   │   ├── jd_matcher.py
│   │   │   ├── skill_gap.py
│   │   │   ├── eligibility.py
│   │   │   └── profile.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── models/
│   │   ├── user.py
│   │   ├── resume.py
│   │   └── analysis.py
│   ├── schemas/
│   ├── services/
│   │   ├── ats_service.py
│   │   ├── gemini_service.py
│   │   └── eligibility_service.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── main.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
├── .env.example
├── alembic.ini
├── requirements.txt
└── README.md
```

</details>

---

## 🚧 Future Improvements

- ✍️ **Cover Letter Generator** — AI-generated, role-specific cover letters
- 🎤 **AI Interview Preparation** — Mock interviews with real-time AI feedback
- 🔄 **Resume Version Comparison** — Compare multiple resume versions side-by-side
- 🎨 **Resume Templates** — Curated, ATS-friendly resume templates
- 🛡️ **Admin Dashboard** — Platform-wide analytics and user management
- 🏢 **Recruiter Portal** — Dedicated portal for recruiters to source candidates
- 🌍 **Multi-language Support** — Localization for global accessibility

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👩‍💻 Author

<div align="center">

### **Ashritha V**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ashritha-v-770408294/)

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/V-Ashritha1)

[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ashritha1255@gmail.com)

<br />

⭐ **If you found this project useful, consider giving it a star!** ⭐

</div>