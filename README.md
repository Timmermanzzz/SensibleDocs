# Sensible Docs

Een professionele web-applicatie waarmee gemeenten hun documenten eenvoudig kunnen anonimiseren volgens de Wet Open Overheid (WOO). Achter de schermen draait een BERT-gebaseerd model (on-premise bij de gemeente) dat 99% van alle PII in meer dan 50 talen detecteert en maskeert.

## ✨ Features

- **🔒 Enterprise Security**: Volledige compliance met WOO-wetgeving
- **🤖 AI-Powered**: BERT-model detecteert 99% van PII in 50+ talen
- **📊 Audit Trail**: Waterdichte logging van alle acties
- **⚡ Performance**: Code splitting, lazy loading, optimized builds
- **♿ Accessibility**: Axe-core checks, Lighthouse CI scores ≥90
- **🐳 Docker Ready**: Multi-stage builds, health checks
- **📱 Responsive**: Modern UI met Tailwind CSS
- **🧪 Well Tested**: 85%+ test coverage, E2E tests

## 🚀 Quick Start

### Vereisten

- Node.js 18+
- Docker & Docker Compose
- Git

### Installatie

```bash
# Clone het project
git clone <repository-url>
cd sensible-docs

# Installeer dependencies
npm install

# Kopieer environment configuratie
cp env.example .env

# Start de ontwikkelomgeving
npm run dev
```

De applicatie is nu beschikbaar op:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Docker Development

```bash
# Start alle services met Docker Compose
docker-compose up -d

# Bekijk logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Build

```bash
# Build voor productie
npm run build

# Docker productie build
npm run build:docker

# Start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 Scripts

| Script | Beschrijving |
|--------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run dev:frontend` | Alleen frontend (Vite) |
| `npm run dev:backend` | Alleen backend (Node.js) |
| `npm run build` | Build productie versie |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:coverage` | Test coverage rapport |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run storybook` | Start Storybook |
| `npm run reset-demo` | Reset demo environment |

## 🎯 Demo Reset Instructies

Het systeem bevat een geautomatiseerd demo reset mechanisme:

### Handmatige Reset

```bash
# Eenmalige reset
npm run reset-demo

# Of via Node.js
node scripts/reset-demo.js
```

### Automatische Reset

```bash
# Start auto-reset (elke 60 minuten)
node scripts/reset-demo.js --auto

# Custom interval via environment
DEMO_RESET_INTERVAL=1800000 node scripts/reset-demo.js --auto
```

### Reset Acties

De reset script:
- 🗑️ Wist `/tmp/demo` directory
- 📁 Wist geüploade bestanden in `/uploads`
- 💾 Reset in-memory application state
- 📝 Creëert verse log bestanden
- ⚙️ Herstelt standaard profielinstellingen

## 🏗️ Architectuur

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling met custom Sensible theme
- **Vite** - Build tool met code splitting
- **React Query** - Server state management
- **Zustand** - UI state management
- **React Router** - Client-side routing
- **React Dropzone** - File uploads
- **Lucide React** - Icons

### Backend Stack
- **Express.js** - API server
- **Winston** - Logging
- **Multer** - File upload handling
- **Helmet** - Security headers
- **CORS** - Cross-origin setup
- **Rate Limiting** - DDoS protection
- **Compression** - Response optimization

### DevOps & Tooling
- **Docker** - Multi-stage containerization
- **Nginx** - Production web server
- **ESLint** - Code linting
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **Storybook** - Component development

## 🔧 Configuratie

### Environment Variables

Kopieer `env.example` naar `.env` en pas aan:

```bash
# Frontend
VITE_APP_TITLE=Sensible Docs
VITE_API_BASE_URL=http://localhost:3001/api

# Backend
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_API_KEY=your-api-key

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./tmp/demo/logs/app.log
```

### Tailwind Theme

Het project gebruikt een custom Sensible theme:

```js
colors: {
  primary: "#00584A",    // Sensible groen
  secondary: "#E6F4F1",  // Licht groen
  accent: "#6B46C1",     // Accent paars
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

### Coverage Gate

Het project vereist **85% minimum coverage**:
- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

## 📋 Known Issues & Workarounds

### Development Issues

1. **Hot Reload Problemen**
   - **Issue**: Vite hot reload werkt soms niet
   - **Workaround**: Restart dev server met `npm run dev:frontend`

2. **Port Conflicts**
   - **Issue**: Poort 3000/3001 al in gebruik
   - **Workaround**: Wijzig PORT in `.env` of stop conflicterende services

3. **File Upload Limiet**
   - **Issue**: Bestanden groter dan 50MB worden geweigerd
   - **Workaround**: Verhoog `MAX_FILE_SIZE` in `.env`

### Docker Issues

1. **Build Failures**
   - **Issue**: Docker build faalt bij dependencies
   - **Workaround**: Clear Docker cache: `docker builder prune`

2. **Volume Permissions**
   - **Issue**: Permission denied bij volumes
   - **Workaround**: Fix permissions: `sudo chown -R $USER:$USER ./uploads ./tmp`

### Production Issues

1. **Memory Usage**
   - **Issue**: Node.js proces gebruikt veel geheugen
   - **Workaround**: Set `NODE_OPTIONS="--max-old-space-size=2048"`

2. **Log Rotation**
   - **Issue**: Log bestanden worden te groot
   - **Workaround**: Configureer logrotate of verhoog `LOG_MAX_SIZE`

## 🤝 Contributing

### Development Workflow

1. **Branch Naming**: `feature/`, `fix/`, `docs/`
2. **Commit Messages**: Conventional Commits format
3. **Pull Requests**: Use provided template
4. **Code Review**: Minimum 1 approval required

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: No warnings allowed
- **Testing**: Minimum 85% coverage
- **Accessibility**: Axe-core checks passing

### Pre-commit Hooks

```bash
# Install Husky hooks
npm run prepare

# Hooks run automatically:
# - ESLint check
# - Type checking
# - Unit tests
# - Commitlint
```

## 📄 License

Private - Sensible Docs Team

## 📞 Support

Voor vragen of problemen:
- **Documentation**: Deze README
- **Issues**: GitHub Issues
- **Email**: support@sensible-docs.nl

---

**Made with ❤️ for Dutch municipalities** 