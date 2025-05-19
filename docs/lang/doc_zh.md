# 资金费率计算器服务器

资金费率计算器服务器是一个强大的代理服务器，设计用于与Coinglass API接口交互，提供加密货币市场的实时资金费率数据。它作为资金计算器应用程序的后端，提供HTTP和WebSocket接口用于数据检索和实时更新。使用Node.js、Express和Socket.IO构建，该服务器确保高性能、可扩展性和可靠性。

## 目录

- [功能特点](#功能特点)
- [架构](#架构)
- [前提条件](#前提条件)
- [安装](#安装)
- [配置](#配置)
- [运行服务器](#运行服务器)
- [API端点](#api端点)
- [WebSocket事件](#websocket事件)
- [监控和日志记录](#监控和日志记录)
- [安全性](#安全性)
- [贡献](#贡献)
- [许可证](#许可证)

## 功能特点

- **Coinglass API代理**：从Coinglass获取并缓存资金费率数据。
- **实时更新**：通过WebSocket提供实时资金费率更新。
- **缓存**：利用内存缓存减少API调用。
- **速率限制**：使用`express-rate-limit`防止滥用。
- **结构化日志记录**：使用`winston`将日志记录到文件和控制台，便于调试和监控。
- **性能监控**：通过`/metrics`暴露Prometheus指标。
- **API密钥认证**：使用请求头中的API密钥保护端点。
- **优雅关闭**：处理终止信号以实现服务器的干净关闭。
- **模块化架构**：组织良好的代码结构，便于扩展和维护。

## 架构

服务器被构建为具有以下组件的模块化Node.js应用程序：

- **Express服务器** (`src/server/index.js`)：处理HTTP请求并作为核心API。
- **Socket.IO** (`src/server/socket.js`)：管理WebSocket连接以实现实时数据更新。
- **路由** (`src/routes/`)：API端点的模块化路由：
  - `/api/proxy/funding-rates`：获取资金费率数据。
- **缓存** (`src/routes/fundingRates.js`)：用于高效数据检索的内存缓存。
- **日志记录** (`src/utils/logger.js`)：使用`winston`将结构化日志记录到`logs/app.log`。
- **配置** (`src/config/index.js`)：使用环境变量的集中配置。
- **中间件** (`src/middlewares/`)：用于认证、速率限制和指标的可重用中间件。
- **入口点** (`src/app.js`)：主服务器初始化和优雅关闭逻辑。

## 前提条件

- **Node.js**：版本18.0.0或更高。
- **npm**：版本8.0.0或更高（或`yarn`）。
- **Coinglass API密钥**：访问资金费率数据所必需。
- **Git**：用于克隆仓库（可选）。

## 安装

1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-repo/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **创建环境文件**：
   复制`.env.example`文件到`.env`并填写所需值：
   ```bash
   cp .env.example .env
   ```
   使用您的Coinglass API密钥和其他设置编辑`.env`（参见[配置](#配置)）。

4. **创建日志目录**：
   ```bash
   mkdir logs
   ```

## 配置

服务器通过`.env`文件中定义的环境变量进行配置。以下是基于`.env.example`的示例：

```
# 访问资金费率的Coinglass API密钥
API_KEY=your_coinglass_api_key

# Coinglass API URL
COINGLASS_API_URL=https://open-api.coinglass.com/public/v2/funding

# 用于CORS的客户端URL（例如，您的前端应用）
CLIENT_URL=https://your-client-app.com

# 服务器端口
PORT=3001

# 资金数据更新间隔（毫秒）
FUNDING_UPDATE_INTERVAL=20000

# WebSocket ping超时（毫秒）
SOCKET_PING_TIMEOUT=60000

# WebSocket ping间隔（毫秒）
SOCKET_PING_INTERVAL=25000

# 日志设置
LOG_LEVEL=info
LOG_COLORS=true
LOG_TO_FILE=true
```

### 配置详情

- **API_KEY**：您的Coinglass API密钥（必需）。
- **COINGLASS_API_URL**：Coinglass API资金费率端点（默认：`https://open-api.coinglass.com/`）。
- **CLIENT_URL**：用于CORS的前端URL（例如，`https://your-client-app.com`）。
- **PORT**：服务器运行的端口（默认：`3001`）。
- **FUNDING_UPDATE_INTERVAL**：更新资金数据的间隔，单位毫秒（默认：`20000`）。
- **SOCKET_PING_TIMEOUT**：WebSocket ping超时，单位毫秒（默认：`60000`）。
- **SOCKET_PING_INTERVAL**：WebSocket ping间隔，单位毫秒（默认：`25000`）。
- **LOG_LEVEL**：日志级别（`error`、`info`、`debug`等；默认：`info`）。
- **LOG_COLORS**：启用控制台彩色日志（`true`或`false`；默认：`true`）。
- **LOG_TO_FILE**：启用文件日志记录（`true`或`false`；默认：`true`）。

## 运行服务器

### 开发模式（使用`nodemon`自动重启）：
```bash
npm run dev
```

### 生产模式：
```bash
npm start
```

服务器将在指定的`PORT`上启动（默认：`3001`）。您应该会看到一条日志消息：
```
[HH:mm:ss] INFO   Server running on port 3001
```

## API端点

### `GET /`
- **描述**：健康检查端点。
- **响应**：
  ```
  Funding Server is running...
  ```

### `GET /api/proxy/funding-rates`
- **描述**：从Coinglass获取资金费率数据，具有分组、过滤和内存缓存功能。缓存每`FUNDING_UPDATE_INTERVAL`毫秒自动更新。
- **请求头**：
  - `x-api-key: <your_api_key>`（必需）。
- **查询参数**：
  - `symbol`（可选）：仅返回指定符号的数据（例如`BTC`）。
  - `minRate`（可选）：按绝对资金费率阈值过滤交易所。
- **响应**：
  - **成功(200)**：
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
  - **错误(403)**：
    ```json
    {
      "error": "API key required"
    }
    ```
  - **错误(502/500)**：
    ```json
    {
      "error": "无法从Coinglass获取资金费率",
      "details": "Error message"
    }
    ```

### `GET /metrics`
- **描述**：暴露用于监控的Prometheus指标。
- **响应**：
  Prometheus兼容指标（例如，`http_request_duration_seconds`）。

## WebSocket事件

服务器使用Socket.IO进行实时数据更新，具有自定义心跳监控、连接统计和智能变更检测等高级功能。

### 连接
- **事件**：`connection`
- **认证**：
  在Socket.IO握手的`auth.apiKey`字段中包含您的API密钥。
  ```javascript
  const socket = io('http://localhost:3001', {
    auth: { apiKey: 'your_api_key' }
  });
  ```

### 事件

- **`initialData`**：
  - **描述**：成功连接后发出。
  - **载荷**：缓存的资金费率数据。
  - **示例**：
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

- **`dataUpdate`**：
  - **描述**：如果数据发生变化，每20秒发出一次（可通过`FUNDING_UPDATE_INTERVAL`配置）。
  - **载荷**：更新的资金费率数据（与`initialData`格式相同）。
  - **注意**：服务器实现了智能变更检测算法，只发送修改过的数据以减少带宽使用。

- **`ping`**：
  - **描述**：服务器发起的心跳，用于检查客户端连接。
  - **载荷**：`{ timestamp: 1714828800000 }`
  - **预期响应**：客户端应该用包含相同timestamp的`pong`事件响应。

- **`pong`**：
  - **描述**：客户端对服务器`ping`事件的响应。
  - **载荷**：`{ timestamp: 1714828800000 }`（与ping中收到的timestamp相同）
  - **注意**：用于计算连接延迟和检测断开的客户端。

- **`subscribe`**：
  - **描述**：客户端事件，用于订阅实时资金费率更新。
  - **载荷**：无
  - **响应**：无，但客户端将开始接收`dataUpdate`事件。

- **`unsubscribe`**：
  - **描述**：客户端事件，用于停止接收资金费率更新。
  - **载荷**：无
  - **响应**：无，客户端将停止接收`dataUpdate`事件。

- **`getConnectionStats`**：
  - **描述**：客户端请求连接统计信息。
  - **载荷**：无
  - **响应**：带有详细连接指标的`connectionStats`事件。

- **`connectionStats`**：
  - **描述**：服务器响应，包含连接统计信息。
  - **载荷**：
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

- **`disconnect`**：
  - **描述**：当客户端断开连接时触发。
  - **载荷**：断开原因（例如，`transport close`）。

## 监控和日志记录

### 日志记录
日志写入：
- `logs/app.log`：所有日志（info、error等）。
- **控制台**：开发时的彩色日志。

日志格式：
- **控制台**：`[HH:mm:ss] LEVEL   Message`
  - 示例：`[12:34:56] INFO   Server running on port 3001`
- **文件(JSON)**：
  ```json
  {
    "level": "info",
    "message": "Server running on port 3001",
    "timestamp": "2025-05-04 12:34:56.789"
  }
  ```

### 监控
- Prometheus指标可在`/metrics`获取。
- 关键指标：
  - `http_request_duration_seconds`：HTTP请求持续时间。
  - 默认Node.js指标（例如，CPU、内存使用）。
- 使用Prometheus服务器和Grafana进行可视化。

## 安全性

- **API密钥认证**：WebSocket连接和`/api/proxy`端点都需要在头部或握手中提供有效的API密钥。
- **CORS**：限制为指定的`CLIENT_URL`。
- **速率限制**：限制对`/api/proxy`的请求为每IP每15分钟100次。
- **环境变量**：敏感数据（例如，`API_KEY`）必须在`.env`中定义。
- **优雅关闭**：确保在`SIGTERM`信号时干净终止。

## 贡献

1. Fork仓库。
2. 创建功能分支（`git checkout -b feature/your-feature`）。
3. 提交更改（`git commit -m 'Add your feature'`）。
4. 推送到分支（`git push origin feature/your-feature`）。
5. 打开拉取请求。

请遵守行为准则，确保所有更改都有良好的文档记录。

## 许可证

本项目采用ISC许可证。详情请参阅`LICENSE`文件。