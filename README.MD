# Funding Calculator Server

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-ISC-blue.svg)
![GitHub Issues](https://img.shields.io/github/issues/CodeNoob53/funding-calculator-server.svg)

The **Funding Calculator Server** is a robust proxy server designed to interface with the Coinglass API, providing real-time funding rate data for cryptocurrency markets. It serves as the backend for a funding calculator application, offering both HTTP and WebSocket interfaces for data retrieval and live updates. Built with Node.js, Express, and Socket.IO, this server ensures high performance, scalability, and reliability.

## Overview

This server acts as a bridge between the Coinglass API and client applications, caching data to reduce API calls and delivering real-time updates via WebSocket. It includes features like API key authentication, rate limiting, Prometheus monitoring, and structured logging for easy maintenance and debugging.

For detailed documentation, including architecture, configuration, API endpoints, and WebSocket events, please refer to the [full documentation](docs/doc.md).

## Features

- Proxy access to Coinglass API for funding rate data.
- Real-time data updates via WebSocket with smart change detection.
- In-memory caching for performance optimization.
- API key authentication for secure access.
- Advanced WebSocket features including:
  - Custom heartbeat monitoring
  - Connection statistics tracking
  - Latency measurement
  - Selective data subscription
- Rate limiting to prevent abuse.
- Prometheus metrics for performance monitoring.
- Structured logging with Winston.
- Graceful shutdown on termination signals.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **npm**: Version 8.0.0 or higher (or Yarn).
- **Coinglass API Key**: Required for accessing funding rate data.
- **Git** (optional, for cloning the repository).

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/CodeNoob53/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment**:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your Coinglass API key and other settings (see [Configuration](docs/doc.md#configuration)).

4. **Create Logs Directory**:
   ```bash
   mkdir logs
   ```

## Running the Server

### Development Mode
Run the server with auto-restart using `nodemon`:
```bash
npm run dev
```

### Production Mode
Run the server in production:
```bash
npm start
```

The server will start on the specified port (default: `3001`). Check the console for a confirmation log:
```
[HH:mm:ss] INFO   Server running on port 3001
```

## WebSocket Client Example

Connect to the server and subscribe to real-time funding rate updates:

```javascript
const { io } = require("socket.io-client");

// Connect with API key authentication
const socket = io("http://localhost:3001", {
  auth: { apiKey: "your_api_key" }
});

// Handle initial data
socket.on("initialData", (data) => {
  console.log("Received initial funding data:", data);
});

// Handle real-time updates
socket.on("dataUpdate", (updates) => {
  console.log("Received funding rate updates:", updates);
});

// Subscribe to updates
socket.emit("subscribe");

// Handle ping events with pong response
socket.on("ping", (data) => {
  socket.emit("pong", data);
});

// Request connection statistics
socket.emit("getConnectionStats");
socket.on("connectionStats", (stats) => {
  console.log("Connection statistics:", stats);
});

// Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

## Configuration

The server is configured via environment variables in the `.env` file. Refer to the [Configuration](docs/doc.md#configuration) section in the documentation for a detailed list of variables and their defaults.

## Contributing

We welcome contributions to enhance the Funding Calculator Server! Please follow these steps:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request.

Please adhere to the Code of Conduct and ensure all changes are well-documented.

## License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter issues or have questions, please open an issue on the [GitHub Issues page](https://github.com/CodeNoob53/funding-calculator-server/issues).

## Acknowledgments

- Thanks to the Coinglass team for providing the API.
- Built with love using Node.js, Express, and Socket.IO.

---

*Last updated: May 2025*