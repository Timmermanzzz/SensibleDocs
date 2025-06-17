# 🚀 Sensible Docs - Vercel Deployment

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sensible-docs)

## Manual Deployment Steps

### 1. Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- Git repository met deze code

### 2. Setup Repository
```bash
# Push naar GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3. Deploy via Vercel Dashboard
1. Ga naar [vercel.com](https://vercel.com)
2. Log in met GitHub
3. Klik "New Project"
4. Selecteer je repository
5. Vercel detecteert automatisch de configuratie
6. Klik "Deploy"

### 4. Environment Variables (optioneel)
In Vercel dashboard → Settings → Environment Variables:
```
NODE_ENV=production
CORS_ORIGIN=https://jouw-app.vercel.app
```

## ✅ Features die werken op Vercel:
- ✅ Frontend (React + Vite)
- ✅ Backend API (Express als serverless functions)
- ✅ Keycloak Mock SSO
- ✅ Audit logging (in-memory)
- ✅ File uploads (temporary)
- ✅ PDF processing (mock)

## ⚠️ Beperkingen Vercel Free Tier:
- Serverless functions timeout na 10 seconden
- Geen persistent file storage
- Geen database (we gebruiken in-memory)
- Audit logs worden niet bewaard tussen requests

## 🎯 Perfect voor:
- ✅ Demo's en presentaties
- ✅ Stakeholder reviews
- ✅ User acceptance testing
- ✅ Prototype validatie

## 📱 Toegang voor collega's:
Na deployment krijg je een URL zoals:
`https://sensible-docs-abc123.vercel.app`

Deze kun je delen met collega's voor testing!

## 🔄 Updates deployen:
Elke push naar de main branch triggert automatisch een nieuwe deployment.

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel deployed automatisch binnen 1-2 minuten
```

## 🐛 Troubleshooting:
- Check Vercel dashboard voor deployment logs
- Serverless functions logs zijn zichtbaar in Functions tab
- Voor local testing: `npm run dev` 