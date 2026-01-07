# Builder stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy Go module files and download dependencies
COPY execution/go.mod ./execution/
WORKDIR /app/execution
RUN go mod download

# Copy source code
COPY execution/ ./

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /ferry-scanner cmd/server/main.go

# Final stage
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary
COPY --from=builder /ferry-scanner /ferry-scanner

# Copy static files
COPY --from=builder /app/execution/static /static

# Copy configuration (optional, if needed by future agents)
COPY .env .

# Expose port
EXPOSE 8080

# Default command
CMD ["/ferry-scanner"]
