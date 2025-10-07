# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Setup Environment

```bash
cp .env.example .env
```

### 2. Configure GitHub Credentials

Edit `.env` file with your GitHub details:

```env
GITHUB_TOKEN=ghp_your_token_here
REPO_OWNER=your-username
REPO_NAME=your-repository
GITHUB_ENTERPRISE_URL=
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:8000 in your browser!

## 🔧 Available Commands

- `npm run dev` - Start development server (converts .env → config.json)
- `npm run convert` - Convert .env to config.json only
- `npm run start` - Start server without conversion (for production)
- `npm run build` - Convert .env to config.json

## 📝 Notes

- The `.env` file is for local development only
- In production, GitHub Actions generates `config.json` from repository secrets
- Never commit `.env` or `config.json` with real credentials
- The application always reads from `config.json`
