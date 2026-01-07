# Ferry Scanner

A simple tool to scan and monitor ferry availability on praamid.ee.

## Quick Start

The easiest way to run the application is with Docker.

### Prerequisites
- Docker installed.

### Run
1. **Build and Run (One-liner)**:
   ```bash
   docker build -t ferry-scanner . && docker run -d -p 8080:8080 --name ferry-scanner ferry-scanner
   ```

2. **Access**:
   Open [http://localhost:8080](http://localhost:8080) in your browser.

3. **Stop**:
   ```bash
   docker rm -f ferry-scanner
   ```

### Testing
To run the backend unit tests:
```bash
make test
```

## Development

- **Backend**: Go (1.23)
- **Frontend**: HTML/JS (Vanilla)
- **Structure**:
    - `execution/`: Source code
    - `directives/`: Standard Operating Procedures

## Features
- **Search**: Find ferry trips by date and direction.
- **Filter**: Filter by time range.
- **Monitor**: Select specific "Full" trips and get alerted (Sound + Notification) when spots open up.
