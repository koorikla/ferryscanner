# Monitor Ferry Availability

## System Architecture

### 1. Execution Layer (Go Backend)
- **Path**: `execution/`
- **Language**: Go 1.23
- **Components**:
    - `internal/ferry/client.go`: Fetches data from `praamid.ee`.
    - `internal/notification/telegram.go`: Handles Telegram API integration.
    - `internal/api/handler.go`: HTTP Handlers (`/api/scan`, `/api/alert`, `/health`).
    - `cmd/server/main.go`: API Server & Static File Server.
- **Testing**: Unit tests in `internal/ferry/*_test.go`. Run with `make test`.

### 2. Interface Layer (Frontend)
- **Source**: `execution/frontend/src/index.ts` (TypeScript)
- **Output**: `execution/static/app.js` (Bundled via esbuild)
- **Tech**: HTML5, Vanilla CSS, TypeScript.
- **Features**:
    - **Persistence**: User inputs (Date, Direction, Contact Info, Preferences) saved to LocalStorage.
    - **Alerts**: Browser (Sound/Notification), Email (SMTP), Telegram.
    - **Configurable Polling**: Selectable interval (10s, 30s, 1m, 5m).
    - **Visual Feedback**: animated "Stop Monitoring" button filling up.
    - **Mobile Optimized**: Responsive layout.

### 3. Infrastructure
- **Docker**: Multi-stage build (`scratch` final image).
- **Orchestration**: `Makefile` for Build, Run, Stop, Test.

## Workflow: Select & Monitor
1.  **User** opens web UI (`http://localhost:8080`).
2.  **Persistence**: Previous settings (Chat ID, Email, Direction) are automatically loaded.
3.  **User** selects Date/Direction -> "Find Ferries".
4.  **App** fetches trips.
5.  **User** checks specific "FULL" trips they want to monitor.
6.  **User** configures alerts:
    - **Browser**: Plays sound and shows popup (if supported).
    - **Email**: Sends email via SMTP (requires `.env` config).
    - **Telegram**: Sends message to Chat ID (requires `.env` token).
7.  **User** clicks "Start Monitoring".
8.  **App** polls API at selected interval.
    - **Progress**: Button fills red to indicate time until next poll.
    - **Alert**: If spot opens -> Triggers configured alerts immediately.
    - **Cooldown**: Email/Telegram alerts have 10m cooldown (reset on restart).

## Configuration

### Environment Variables (`.env`)
```
PORT=8080
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
TELEGRAM_BOT_TOKEN=your-bot-token
```

## Commands
| Command | Description |
| :--- | :--- |
| `make run` | Full rebuild (Frontend + Docker) and start container. |
| `make stop` | Stop and remove container. |
| `make logs` | View server logs. |
| `make test` | Run Go backend unit tests. |
| `make build-front` | Rebuild TypeScript frontend only. |
