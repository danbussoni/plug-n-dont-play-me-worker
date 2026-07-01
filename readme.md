# Plug-n-Don't-Play Worker

Cloudflare Worker responsible for securely proxying baseline requests from the Plug-n-Don't-Play client to the official GitHub RAW repository.

## Features

- Stateless architecture
- Transparent reverse proxy with request validation and endpoint hardening (GitHub RAW https://raw.githubusercontent.com/danbussoni/plug-n-dont-play-me-raw-data/main/win_default_services_config.map)
- GET and HEAD only
- Endpoint hardening
- Request validation
- Payload rejection
- Structured logging
- GitHub metadata preservation (ETag, Content-Length, Last-Modified)
- Cloudflare native request metrics and observability (leverages the Workers platform dashboard for request counts, logs, and operational visibility without requiring Workers KV, D1, Durable Objects, or custom telemetry)

## Architecture

```
AHK Client
     │
     ▼
Cloudflare Worker
     │
     ▼
GitHub RAW
```

The worker intentionally keeps no persistent state.

No telemetry, databases or user tracking are implemented.

Its purpose is to provide:

- Security
- Request filtering
- Observability
- Operational transparency

## Repository

This repository contains only the Worker source code.

The Windows baseline files remain hosted in the dedicated RAW repository.