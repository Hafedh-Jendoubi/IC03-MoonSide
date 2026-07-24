# Moonside Connect

Intelligent Enterprise Social Network — Final Year Project (PFE)

## 📋 Overview

Moonside Connect is an intelligent internal social network built for Moonside Corporation. It centralizes company communication in one place — posts, comments, teams, departments, notifications, and search — and layers AI-assisted writing on top to help employees communicate faster and more clearly.

The platform is built as a Spring Cloud microservices backend (nine Java services + one Python AI service) behind an API Gateway, with a Next.js frontend and Eureka-based service discovery.

## 🎓 Context

This is an end-of-studies graduation project (PFE) developed during an internship at Moonside Corporation.

## 🏗️ Architecture

```
                                   ┌──────────────┐
                                   │   Frontend   │  Next.js — :3000
                                   └──────┬───────┘
                                          │
                                   ┌──────▼───────┐
                                   │   Gateway    │  Spring Cloud Gateway — :8080
                                   └──────┬───────┘
                                          │  (service discovery via Eureka — :8761)
        ┌───────────┬────────────┬───────┼────────┬────────────┬─────────────┬─────────────┐
        ▼           ▼            ▼       ▼        ▼            ▼             ▼             ▼
   User-Service  Organization  Post-Service Notification Badge-Service Media-Service Search-Service AI-Service
     :8081        -Service       :8085      -Service       :8088         :8082         :8087       :8089
                    :8084                    :8086                                                (FastAPI)
```

All backend services register with **Eureka** and are routed through the **Gateway**, which exposes a single entry point to the frontend and load-balances (`lb://`) to whichever service instance is available.

| Route prefix (via Gateway) | Backend service | Java | Responsibilities |
|---|---|---|---|
| `/auth/**`, `/users/**`, `/roles/**`, `/permissions/**`, `/audit-logs/**`, `/connections/**` | **User-Service** | 17 | Authentication (JWT), users, roles, permissions (RBAC), audit logs, user-to-user connections |
| `/organizations/**` | **Organization-Service** | 17 | Departments, teams, projects, org stats, follow relationships |
| `/posts/**`, `/interactions/**` | **Post-Service** | 17 | Posts, comments, reactions, attachments, saved posts, surveys, post stats |
| `/api/notifications/**` | **Notification-Service** | 17 | Real-time / async notifications, Kafka-driven |
| `/badges/**` | **Badge-Service** | 17 | Gamification — badges, user badges, awarding rules |
| `/media/**` | **Media-Service** | 17 | File & avatar uploads, backed by MinIO (S3-compatible) |
| `/search/**` | **Search-Service** | 17 | Global search across users, posts, and teams via Elasticsearch |
| `/ai/**` | **AI-Service** | Python 3.12 | Groq-powered grammar fixing, tone rewriting, paragraph generation, comment suggestions |
| — | **Eureka** | 21 | Service discovery / registry |
| — | **Gateway** | 21 | Single entry point, routing, CORS |

## 🔧 Tech Stack

### Backend
- **Java 17 / 21 + Spring Boot** — microservices (Spring Cloud 2023.0.1)
- **Spring Cloud Gateway** — API Gateway & routing
- **Netflix Eureka** — service discovery
- **Python 3.12 + FastAPI** — AI-Service (Groq LLM integration)
- **MongoDB** — primary datastore (one logical database per service)
- **Apache Kafka** (KRaft mode, no ZooKeeper) — event streaming (notifications, badges)
- **Elasticsearch** — global search index
- **Redis** — caching (feed/post/reaction caching) and short-lived OTP storage
- **MinIO** — S3-compatible object storage for media/avatars

### Frontend
- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI primitives)
- **React Hook Form** + **Zod** for forms/validation
- **Recharts** for analytics/stats visualizations

### DevOps
- **Docker Compose** for local orchestration of the full stack
- **GitHub Actions** — separate CI pipelines for Backend and Frontend, plus a CD pipeline that builds & pushes every service image to Docker Hub
- **Husky + lint-staged + Prettier** — pre-commit formatting for the Frontend

## ✨ Core Features

- User authentication & profiles, with role-based permissions (RBAC) and audit logging
- User-to-user connections (colleague network)
- Posts, comments, reactions, attachments, saved posts, and surveys
- Departments, teams, projects, and org-wide stats
- Badges & gamification
- Real-time notifications (Kafka-driven)
- Global search across users, posts, and teams (Elasticsearch)
- AI writing assistant — grammar fixing, tone rewriting, paragraph generation, comment suggestions (Groq)
- Deep-link integrations to start a chat in **Microsoft Teams** or compose an email in **Outlook Web** directly from a colleague's profile
- Admin dashboard for organization management

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local Frontend dev without Docker)
- Java 17 & 21, Maven (for local backend dev without Docker)
- Python 3.12 (for local AI-Service dev without Docker)
- A [Groq API key](https://console.groq.com/keys) (for the AI-Service)

### Run the full stack with Docker Compose

```bash
cd Backend
cp .env.example .env   # fill in Mongo/Mail/MinIO/JWT/Groq credentials
docker compose up --build
```

This starts every service — MongoDB, Kafka, Elasticsearch, Redis, MinIO, Eureka, the Gateway, all backend microservices, the AI-Service, and the Frontend.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Eureka dashboard | http://localhost:8761 |
| MinIO console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

### Run services individually (local dev)

**A Java microservice:**
```bash
cd Backend/<Service-Name>
./mvnw spring-boot:run
```

**The AI-Service:**
```bash
cd Backend/AI-Service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY
uvicorn app.main:app --reload --port 8089
```

**The Frontend:**
```bash
cd Frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to the Gateway
npm run dev
```

## 🧪 CI/CD

- **`CI_Backend.yml`** — runs on every `Backend/**` change; tests each of the 9 Java services against live Mongo/Kafka/Elasticsearch containers, and lints/import-checks the AI-Service
- **`CI_Frontend.yml`** — Prettier, type-check, tests, build, and a Docker build smoke-test
- **`CD.yml`** — on push to `dev`/`main`, builds and pushes every service (including the Frontend) as a Docker image to Docker Hub, tagged `staging` or `latest` depending on branch

## 📁 Project Structure

```
Project/
├── Backend/
│   ├── Eureka/                 # Service discovery
│   ├── Gateway/                # API Gateway
│   ├── User-Service/           # Auth, users, roles, permissions, connections
│   ├── Organization-Service/   # Departments, teams, projects
│   ├── Post-Service/           # Posts, comments, reactions, attachments
│   ├── Notification-Service/   # Notifications (Kafka)
│   ├── Badge-Service/          # Gamification
│   ├── Media-Service/          # File/avatar uploads (MinIO)
│   ├── Search-Service/         # Elasticsearch-backed search
│   ├── AI-Service/             # FastAPI + Groq writing assistant
│   └── docker-compose.yml
├── Frontend/                   # Next.js app (feed, teams, badges, admin, etc.)
└── .github/workflows/          # CI_Backend, CI_Frontend, CD
```

## 👤 Author

**Hafedh Jendoubi**
- Full Stack Developer Intern @ Moonside Corporation
- Final Year Engineering Project

## 📄 License

MIT — see [LICENSE](./LICENSE).

## 📅 Status

Currently in active development.