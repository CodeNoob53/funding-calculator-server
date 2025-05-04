Funding Calculator Server
The Funding Calculator Server is a robust proxy server designed to interface with the Coinglass API, providing real-time funding rate data for cryptocurrency markets. It serves as a backend for a funding calculator application, offering both HTTP and WebSocket interfaces for data retrieval and live updates. The server is built with Node.js, Express, and Socket.IO, ensuring high performance, scalability, and reliability.
Table of Contents

Features
Architecture
Prerequisites
Installation
Configuration
Running the Server
API Endpoints
WebSocket Events
Monitoring and Logging
Security
Contributing
License

Features

Proxy for Coinglass API: Fetches and caches funding rate data from Coinglass.
Real-Time Updates: Delivers live funding rate updates via WebSocket.
Caching: Utilizes in-memory caching with node-cache to reduce API calls.
Rate Limiting: Protects against abuse with express-rate-limit.
Structured Logging: Logs to files and console using winston for easy debugging and monitoring.
Performance Monitoring: Exposes metrics via Prometheus at /metrics.
Secure Authentication: Uses JWT for WebSocket connections.
Graceful Shutdown: Handles termination signals for clean server shutdown.
API Versioning: Supports versioned API endpoints (/api/v1).

Architecture
The server is structured as a modular Node.js application with the following components:

Express Server: Handles HTTP requests and serves as the core API.
Socket.IO: Manages WebSocket connections for real-time data updates.
Routes: Modular routing for API endpoints (e.g., /api/v1/proxy/funding-rates-extended).
Caching: In-memory cache (node-cache) for efficient data retrieval.
Logging: Structured logging with winston to logs/error.log and logs/combined.log.
Configuration: Centralized configuration in config/index.js and environment variables.
Utilities: Reusable utilities like logging (utils/logger.js).

Prerequisites

Node.js: Version 18.0.0 or higher.
npm: Version 8.0.0 or higher.
Coinglass API Key: Required for accessing funding rate data.
Git: For cloning the repository (optional).

Installation

Clone the Repository:
git clone https://github.com/your-repo/funding-calculator-server.git
cd funding-calculator-server


Install Dependencies:
npm install


Create Environment File:Copy the .env.example file to .env and fill in the required values:
cp .env.example .env

Edit .env with your Coinglass API key, JWT secret, and other settings (see Configuration).

Create Logs Directory:
mkdir logs



Configuration
The server is configured via environment variables defined in the .env file. Below is an example based on .env.example:
# Coinglass API key for accessing funding rates
API_KEY=your_coinglass_api_key

# Coinglass API URL
COINGLASS_API_URL=https://open-api.coinglass.com/public/v2/funding

# JWT secret for WebSocket authentication
JWT_SECRET=your_jwt_secret_key

# Client URL for CORS (e.g., your frontend app)
CLIENT_URL=https://your-client-app.com

# Server port
PORT=3001

# Configuration parameters (used via config/index.js)
# Cache TTL in seconds
CACHE_TTL=60

# Funding data update interval in milliseconds
FUNDING_UPDATE_INTERVAL=20000

# WebSocket ping timeout in milliseconds
SOCKET_PING_TIMEOUT=30000

# WebSocket ping interval in milliseconds
SOCKET_PING_INTERVAL=10000

Configuration Details

API_KEY: Your Coinglass API key (required).
COINGLASS_API_URL: The Coinglass API endpoint for funding rates (default: https://open-api.coinglass.com/public/v2/funding).
JWT_SECRET: A secure key for JWT authentication (required).
CLIENT_URL: The frontend URL for CORS (e.g., https://your-client-app.com).
PORT: The port on which the server runs (default: 3001).
CACHE_TTL: Cache time-to-live in seconds (default: 60).
FUNDING_UPDATE_INTERVAL: Interval for updating funding data in milliseconds (default: 20000).
SOCKET_PING_TIMEOUT: WebSocket ping timeout in milliseconds (default: 30000).
SOCKET_PING_INTERVAL: WebSocket ping interval in milliseconds (default: 10000).

Running the Server

Development Mode (with nodemon for auto-restart):
npm run dev


Production Mode:
npm start



The server will start on the specified PORT (default: 3001). You should see a log message:
[INFO] Server running on port 3001

API Endpoints
GET /

Description: Health check endpoint.
Response:Funding Server is running...



GET /api/v1/proxy/funding-rates-extended

Description: Fetches extended funding rate data from Coinglass, cached for performance.
Headers:
None required (API key is handled server-side).


Response:
Success (200):{
  "data": [
    { "symbol": "BTC", "fundingRate": 0.01, ... },
    ...
  ]
}


Error (500):{
  "error": "Failed to fetch funding rates from Coinglass",
  "details": "Error message"
}





GET /metrics

Description: Exposes Prometheus metrics for monitoring.
Response:
Prometheus-compatible metrics (e.g., http_request_duration_seconds).



WebSocket Events
The server uses Socket.IO for real-time data updates. Clients must authenticate with a JWT token.
Connection

Event: connection
Authentication:
Include a JWT token in the auth.token field of the Socket.IO handshake.
Example:const socket = io('http://localhost:3001', {
  auth: { token: 'your_jwt_token' }
});





Events

initialData:

Emitted upon successful connection.
Payload: Cached funding rate data.
Example:{
  "data": [
    { "symbol": "BTC", "fundingRate": 0.01, ... },
    ...
  ]
}




dataUpdate:

Emitted every 20 seconds (configurable via FUNDING_UPDATE_INTERVAL) if data has changed.
Payload: Updated funding rate data (same format as initialData).


disconnect:

Triggered when a client disconnects.
Payload: Reason for disconnection (e.g., transport close).



Monitoring and Logging

Logging:

Logs are written to:
logs/error.log: Error-level logs.
logs/combined.log: All logs (info, error, etc.).
Console: Colorized logs for development.


Log format: JSON with timestamp, level, and message.
Example:{
  "level": "info",
  "message": "[INFO] Server running on port 3001",
  "timestamp": "2025-05-03 12:34:56"
}




Monitoring:

Prometheus metrics are available at /metrics.
Key metrics:
http_request_duration_seconds: Duration of HTTP requests.
Default Node.js metrics (e.g., CPU, memory usage).


Use a Prometheus server and Grafana for visualization.



Security

JWT Authentication: WebSocket connections require a valid JWT token.
CORS: Restricted to the specified CLIENT_URL.
Rate Limiting: Limits requests to /api/v1/proxy to 100 per 15 minutes per IP.
Environment Variables: Sensitive data (e.g., API_KEY, JWT_SECRET) must be defined in .env.
Graceful Shutdown: Ensures clean termination on SIGTERM.

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.

Please follow the Code of Conduct and ensure all changes are well-documented.
License
This project is licensed under the ISC License. See the LICENSE file for details.
