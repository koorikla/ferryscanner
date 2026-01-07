# Ferry Scanner

A simple tool to scan and monitor ferry availability on praamid.ee.

## Quick Start

The easiest way to run the application is with Docker.

### Prerequisites
- Docker installed.

### 🚀 Quick Run (Pre-built)
Run the latest version immediately without building:
```bash
docker run -d -p 8080:8080 ghcr.io/koorikla/ferryscanner:latest
```

### 🛠️ Build & Run (Local)

**Option A: Using Make (Recommended)**
```bash
make run
```
To stop: `make stop`

**Option B: Using Docker directly**
```bash
docker build -t ferry-scanner .
docker run -d -p 8080:8080 --name ferry-scanner ferry-scanner
```

### Access
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Testing
To run the backend unit tests:
```bash
make test
```

## Development

- **Backend**: Go (1.23)
- **Frontend**: TypeScript, HTML5, CSS3, Vanilla JS
- **Container**: Docker (Scratch image)

## Deployment

### GitHub Actions
Every push to the `main` branch automatically triggers a workflow that:
1.  Builds the TypeScript frontend.
2.  Builds the Docker image.
3.  Pushes the image to **GitHub Container Registry (GHCR)**.

### Manual Build
```bash
make build
# or
docker build -t ferry-scanner .
```

## Structure
    - `execution/`: Source code
    - `directives/`: Standard Operating Procedures

## Features
- **Search**: Find ferry trips by date and direction.
- **Filter**: Filter by time range.
- **Monitor**: Select specific "Full" trips and get alerted (Sound + Notification) when spots open up.
