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

## Configuration (Time & Email)

The server is stateless but requires environment variables for configuration.

### Environment Variables
Create a `.env` file locally or set these in your cloud provider:

```bash
PORT=8080

# Email Alerts (Optional)
# Example for Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

> **Note for Gmail:** You cannot use your regular password. You MUST enable 2FA and create an [App Password](https://myaccount.google.com/apppasswords).

## Deployment

### GitHub Actions (Recommended)
This repo includes a GitHub Action to automatically build and push the Docker image to GHCR.
1.  Push to `main`.
2.  Image is built: `ghcr.io/koorikla/ferryscanner:latest`
3.  Deploy this image to your VPS or Cloud (e.g. Koyeb, DigitalOcean).
    -   **Important:** Set the `SMTP_` variables in your cloud dashboard secret management if you want email alerts.

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
