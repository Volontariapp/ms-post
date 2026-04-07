<!-- gitnexus:start -->
# 📝 Volontariapp - Post Microservice (`ms-post`)

[![NestJS](https://img.shields.io/badge/framework-NestJS-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![GitNexus](https://img.shields.io/badge/intelligence-GitNexus-orange.svg)](https://gitnexus.vercel.app/)

The **Post Microservice** handles the social aspect of Volontariapp, including user posts, comments, and community interactions.

---

## 🧠 Code Intelligence with GitNexus

This project uses **GitNexus** to maintain a live knowledge graph of the codebase.

### 🚀 Visualization
To see the codebase graph:
1. Run `npx gitnexus serve`
2. Visit [https://gitnexus.vercel.app/](https://gitnexus.vercel.app/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn

### Installation
```bash
yarn install
```

### Running the App
```bash
# Development mode
yarn run start:dev

# Production mode
yarn run start:prod
```

### Running Tests
```bash
# Unit tests
yarn run test

# Integration tests
yarn run test:int
```

---

## 🏗️ Architecture
- **Post Feed**: Logic for generating user feeds.
- **Interactions**: Manages likes, comments, and shares.
- **Sequelize Models**: Stores posts and interaction data.

---

## 📜 License
This project is [MIT licensed](LICENSE).

test
