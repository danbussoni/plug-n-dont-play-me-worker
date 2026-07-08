# Plug-n-Don't-Play-me — Worker

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

## 🔄 Repository: CI/CD & Infrastructure Topology

This project leverages a modern **GitOps Continuous Integration & Continuous Deployment (CI/CD)** pipeline that orchestrates state synchronization across cloud providers. Every change committed to the core configurations triggers an automated, headless deployment directly to the network edge.

### 🌐 Architectural Flow

The infrastructure operates via an inter-cloud reactive pattern, completely removing manual overhead from the deployment lifecycle:

graph TD
    A[Developer] -->|Web / Local Commit| B(GitHub Repository)
    B -->|Webhook Trigger| C{Cloudflare Edge}
    C --> D[Automated Syntax Validation]
    C --> E[Wrangler Isolation Build]
    D --> F[Live Worker Engine v.X]
    E --> F
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#f96,stroke:#333,stroke-width:2px
    style F fill:#9f9,stroke:#333,stroke-width:2px

### 🛠️ Continuous Deployment Pipeline Specifications

The deployment pipeline is governed by Cloudflare Workers Builds using strict runtime compatibility flags to preserve edge predictability:

* **Build Engine:** `wrangler@4.108.0` (Automated environment virtualization).
* **Target Build Script:**
  ```bash
  npx wrangler deploy worker.js --name plug-n-dont-play-me --compatibility-date 'XPTO'
  Immutable Version Snapshot: The --compatibility-date locks the V8 engine runtime mechanics to ensure downstream changes in Cloudflare's core infrastructure will never introduce breaking anomalies into the reverse proxy logic.

Deterministic Payload Delivery: The pipeline forces memory-buffered streaming (response.arrayBuffer()) to bypass intermediate chunked transfer encodings (Transfer-Encoding: chunked), successfully preserving static Content-Length metadata for low-level client networking subsystems (e.g., WinINet).
