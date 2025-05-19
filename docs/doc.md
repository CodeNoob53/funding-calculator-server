# Funding Calculator Server

The Funding Calculator Server is a robust proxy server designed to interface with the Coinglass API, providing real-time funding rate data for cryptocurrency markets. It serves as the backend for a funding calculator application, offering both HTTP and WebSocket interfaces for data retrieval and live updates. Built with Node.js, Express, and Socket.IO, the server ensures high performance, scalability, and reliability.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Proxy for Coinglass API**: Fetches and caches funding rate data from Coinglass.
- **Real-Time Updates**: Delivers live funding rate updates via WebSocket.
- **Caching**: Utilizes in-memory caching to reduce API calls.
- **Rate Limiting**: Protects against abuse with `express-rate-limit`.
- **Structured Logging**: Logs to files and console using `winston` for easy debugging and monitoring.
- **Performance Monitoring**: Exposes metrics via Prometheus at `/metrics`.
- **API Key Authentication**: Secures endpoints using an API key in the request header.
- **Graceful Shutdown**: Handles termination signals for clean server shutdown.
- **Modular Architecture**: Organized code structure for scalability and maintainability.

## Architecture

The server is structured as a modular Node.js application with the following components:

- **Express Server** (`src/server/index.js`): Handles HTTP requests and serves as the core API.
- **Socket.IO** (`src/server/socket.js`): Manages WebSocket connections for real-time data updates.
- **Routes** (`src/routes/`): Modular routing for API endpoints:
  - `/api/proxy/funding-rates`: Fetches funding rate data.
- **Caching** (`src/routes/fundingRates.js`): In-memory cache for efficient data retrieval.
- **Logging** (`src/utils/logger.js`): Structured logging with `winston` to `logs/app.log`.
- **Configuration** (`src/config/index.js`): Centralized configuration using environment variables.
- **Middlewares** (`src/middlewares/`): Reusable middleware for authentication, rate limiting, and metrics.
- **Entry Point** (`src/app.js`): Main server initialization and graceful shutdown logic.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **npm**: Version 8.0.0 or higher (or `yarn`).
- **Coinglass API Key**: Required for accessing funding rate data.
- **Git**: For cloning the repository (optional).

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Create Environment File**:
   Copy the `.env.example` file to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Coinglass API key and other settings (see [Configuration](#configuration)).

4. **Create Logs Directory**:
   ```bash
   mkdir logs
   ```

## Configuration

The server is configured via environment variables defined in the `.env` file. Below is an example based on `.env.example`:

```
# Coinglass API key for accessing funding rates
API_KEY=your_coinglass_api_key

# Coinglass API URL
COINGLASS_API_URL=https://open-api.coinglass.com/public/v2/funding

# Client URL for CORS (e.g., your frontend app)
CLIENT_URL=https://your-client-app.com

# Server port
PORT=3001

# Funding data update interval in milliseconds
FUNDING_UPDATE_INTERVAL=20000

# WebSocket ping timeout in milliseconds
SOCKET_PING_TIMEOUT=60000

# WebSocket ping interval in milliseconds
SOCKET_PING_INTERVAL=25000

# Logging settings
LOG_LEVEL=info
LOG_COLORS=true
LOG_TO_FILE=true
```

### Configuration Details

- **API_KEY**: Your Coinglass API key (required).
- **COINGLASS_API_URL**: The Coinglass API endpoint for funding rates (default: `https://open-api.coinglass.com/`).
- **CLIENT_URL**: The frontend URL for CORS (e.g., `https://your-client-app.com`).
- **PORT**: The port on which the server runs (default: `3001`).
- **FUNDING_UPDATE_INTERVAL**: Interval for updating funding data in milliseconds (default: `20000`).
- **SOCKET_PING_TIMEOUT**: WebSocket ping timeout in milliseconds (default: `60000`).
- **SOCKET_PING_INTERVAL**: WebSocket ping interval in milliseconds (default: `25000`).
- **LOG_LEVEL**: Logging level (`error`, `info`, `debug`, etc.; default: `info`).
- **LOG_COLORS**: Enable colored logs in the console (`true` or `false`; default: `true`).
- **LOG_TO_FILE**: Enable logging to file (`true` or `false`; default: `true`).

## Running the Server

### Development Mode (with `nodemon` for auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on the specified `PORT` (default: `3001`). You should see a log message:
```
[HH:mm:ss] INFO   Server running on port 3001
```

## API Endpoints

### `GET /`
- **Description**: Health check endpoint.
- **Response**:
  ```
  Funding Server is running...
  ```

### `GET /api/proxy/funding-rates`
- **Description**: Fetches funding rate data from Coinglass, with grouping, filtering, and in-memory caching. Cache is auto-updated every `FUNDING_UPDATE_INTERVAL` ms.
- **Headers**:
  - `x-api-key: <your_api_key>` (required).
- **Query Parameters**:
  - `symbol` (optional): Return data only for the specified symbol (e.g. `BTC`).
  - `minRate` (optional): Filter exchanges by absolute funding rate threshold.
- **Response**:
  - **Success (200)**:
    ```json
    [
      {
        "symbol": "BTC",
        "symbolLogo": "...",
        "exchanges": [
          {
            "exchange": "Binance",
            "exchangeLogo": "...",
            "rate": 0.01,
            "predictedRate": 0.012,
            "interestRate": 0.001,
            "fundingIntervalHours": 8,
            "nextFundingTime": 1714828800000,
            "price": 65000,
            "status": 1
          }
        ]
      }
      // ...
    ]
    ```
  - **Error (403)**:
    ```json
    {
      "error": "API key required"
    }
    ```
  - **Error (502/500)**:
    ```json
    {
      "error": "Не вдалося отримати ставки фандингу з Coinglass",
      "details": "Error message"
    }
    ```

### `GET /metrics`
- **Description**: Exposes Prometheus metrics for monitoring.
- **Response**:
  Prometheus-compatible metrics (e.g., `http_request_duration_seconds`).

## WebSocket Events

The server uses Socket.IO for real-time data updates with advanced features like custom heartbeat monitoring, connection statistics, and smart change detection.

### Connection
- **Event**: `connection`
- **Authentication**:
  Include your API key in the `auth.apiKey` field of the Socket.IO handshake.
  ```javascript
  const socket = io('http://localhost:3001', {
    auth: { apiKey: 'your_api_key' }
  });
  ```

### Events

- **`initialData`**:
  - **Description**: Emitted upon successful connection.
  - **Payload**: Cached funding rate data.
  - **Example**:
    ```json
    [
      {
        "symbol": "BTC",
        "symbolLogo": "...",
        "exchanges": [
          { "exchange": "Binance", "rate": 0.01, ... }
        ]
      }
      // ...
    ]
    ```

- **`dataUpdate`**:
  - **Description**: Emitted every 20 seconds (configurable via `FUNDING_UPDATE_INTERVAL`) if data has changed.
  - **Payload**: Updated funding rate data (same format as `initialData`).
  - **Note**: The server implements a smart change detection algorithm that only sends modified data to reduce bandwidth usage.

- **`ping`**:
  - **Description**: Server-initiated heartbeat to check client connectivity.
  - **Payload**: `{ timestamp: 1714828800000 }`
  - **Expected Response**: Client should respond with a `pong` event containing the same timestamp.

- **`pong`**:
  - **Description**: Client response to server's `ping` event.
  - **Payload**: `{ timestamp: 1714828800000 }` (same timestamp received in the ping)
  - **Note**: Used to calculate connection latency and detect disconnected clients.

- **`subscribe`**:
  - **Description**: Client event to subscribe to real-time funding rate updates.
  - **Payload**: None
  - **Response**: None, but client will start receiving `dataUpdate` events.

- **`unsubscribe`**:
  - **Description**: Client event to stop receiving funding rate updates.
  - **Payload**: None
  - **Response**: None, client will stop receiving `dataUpdate` events.

- **`getConnectionStats`**:
  - **Description**: Client request for connection statistics.
  - **Payload**: None
  - **Response**: `connectionStats` event with detailed connection metrics.

- **`connectionStats`**:
  - **Description**: Server response with connection statistics.
  - **Payload**:
    ```json
    {
      "connectedAt": "2023-05-04T12:34:56.789Z",
      "sessionDuration": 3600,
      "pingCount": 120,
      "pongCount": 120,
      "missedPongs": 0,
      "currentLatency": 45,
      "averageLatency": 52,
      "isSubscribed": true
    }
    ```

- **`disconnect`**:
  - **Description**: Triggered when a client disconnects.
  - **Payload**: Reason for disconnection (e.g., `transport close`).

## Monitoring and Logging

### Logging
Logs are written to:
- `logs/app.log`: All logs (info, error, etc.).
- **Console**: Colorized logs for development.

Log format:
- **Console**: `[HH:mm:ss] LEVEL   Message`
  - Example: `[12:34:56] INFO   Server running on port 3001`
- **File (JSON)**:
  ```json
  {
    "level": "info",
    "message": "Server running on port 3001",
    "timestamp": "2025-05-04 12:34:56.789"
  }
  ```

### Monitoring
- Prometheus metrics are available at `/metrics`.
- Key metrics:
  - `http_request_duration_seconds`: Duration of HTTP requests.
  - Default Node.js metrics (e.g., CPU, memory usage).
- Use a Prometheus server and Grafana for visualization.

## Security

- **API Key Authentication**: Both WebSocket connections and `/api/proxy` endpoints require a valid API key in the header or handshake.
- **CORS**: Restricted to the specified `CLIENT_URL`.
- **Rate Limiting**: Limits requests to `/api/proxy` to 100 per 15 minutes per IP.
- **Environment Variables**: Sensitive data (e.g., `API_KEY`) must be defined in `.env`.
- **Graceful Shutdown**: Ensures clean termination on `SIGTERM`.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please follow the Code of Conduct and ensure all changes are well-documented.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details.