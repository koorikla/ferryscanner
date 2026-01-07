# Monitor Ferry Availability

**G## System Architecture

### 1. Execution Layer (Go Backend)
- **Path**: `execution/`
- **Language**: Go 1.23
- **Components**:
    - `internal/ferry/client.go`: Fetches data from `praamid.ee`.
    - `internal/api/handler.go`: HTTP Handlers (`/api/scan`, `/health`).
    - `cmd/server/main.go`: API Server & Static File Server.
- **Testing**: Unit tests in `internal/ferry/*_test.go`. Run with `make test`.

### 2. Interface Layer (Frontend)
- **Path**: `execution/static/index.html`
- **Tech**: HTML5, CSS3, Vanilla JS.
- **Features**:
    - Trip selection & monitoring.
    - Audio alerts (Beep).
    - Browser Notifications.
    - Responsive Mobile Design.
- **Future**: Migrate to TypeScript for better maintainability.

### 3. Infrastructure
- **Docker**: Multi-stage build (`scratch` final image).
- **Orchestration**: `Makefile` for Build, Run, Stop, Test.

## Workflow: Select & Monitor
1.  **User** opens web UI.
2.  **User** selects Date/Direction -> "Find Ferries".
3.  **App** fetches all trips.
4.  **User** checks specific "FULL" trips to monitor.
5.  **App** polls API every 30s.
6.  **Alert**: If spot opens -> Play Sound + Send Notification.
7.  **Future**: Send Email alert.

## Commands
- **Run**: `make run` (Builds Frontend + Backend + Docker)
- **Test**: `make test` (Runs Go Unit Tests)
- **Stop**: `make stop`
- **Build Frontend**: `make build-front`

## CI/CD
- **Platform**: GitHub Actions
- **Workflow**: `.github/workflows/docker-publish.yml`
- **Triggers**: Push to `main`
- **Artifact**: Docker Image pushed to `ghcr.io/koorikla/ferryscanner:latest` The browser will poll every 30s and alert when spots open.

**Outputs**:
- Web UI showing available trips.
