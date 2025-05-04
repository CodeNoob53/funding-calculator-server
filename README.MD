Funding Calculator Server

The Funding Calculator Server is a robust proxy server designed to interface with the Coinglass API, providing real-time funding rate data for cryptocurrency markets. It serves as the backend for a funding calculator application, offering both HTTP and WebSocket interfaces for data retrieval and live updates. Built with Node.js, Express, and Socket.IO, this server ensures high performance, scalability, and reliability.
Overview
This server acts as a bridge between the Coinglass API and client applications, caching data to reduce API calls and delivering real-time updates via WebSocket. It includes features like JWT authentication, rate limiting, Prometheus monitoring, and structured logging for easy maintenance and debugging.
For detailed documentation, including architecture, configuration, API endpoints, and WebSocket events, please refer to the full documentation.
Features

Proxy access to Coinglass API for funding rate data.
Real-time data updates via WebSocket.
In-memory caching for performance optimization.
JWT-based authentication for secure access.
Rate limiting to prevent abuse.
Prometheus metrics for performance monitoring.
Structured logging with Winston.
Graceful shutdown on termination signals.

Prerequisites

Node.js: Version 18.0.0 or higher.
npm: Version 8.0.0 or higher (or Yarn).
Coinglass API Key: Required for accessing funding rate data.
Git (optional, for cloning the repository).

Installation

Clone the Repository:
git clone https://github.com/CodeNoob53/funding-calculator-server.git
cd funding-calculator-server


Install Dependencies:
npm install


Set Up Environment:

Copy the .env.example file to .env:cp .env.example .env


Edit .env with your Coinglass API key, JWT secret, and other settings (see Configuration in docs/config.md).


Create Logs Directory:
mkdir logs



Running the Server
Development Mode
Run the server with auto-restart using nodemon:
npm run dev

Production Mode
Run the server in production:
npm start

The server will start on the specified port (default: 3001). Check the console for a confirmation log:
[HH:mm:ss] INFO   Server running on port 3001

Configuration
The server is configured via environment variables in the .env file. Refer to the Configuration section in docs/config.md for a detailed list of variables and their defaults.
Contributing
We welcome contributions to enhance the Funding Calculator Server! Please follow these steps:

Fork the repository.
Create a feature branch:git checkout -b feature/your-feature


Commit your changes:git commit -m "Add your feature"


Push to the branch:git push origin feature/your-feature


Open a pull request.

Please adhere to the Code of Conduct and ensure all changes are well-documented. For more details, see the Contributing section in docs/config.md.
License
This project is licensed under the ISC License. See the LICENSE file for details.
Support
If you encounter issues or have questions, please open an issue on the GitHub Issues page.
Acknowledgments

Thanks to the Coinglass team for providing the API.
Built with love using Node.js, Express, and Socket.IO.


Last updated: May 04, 2025
