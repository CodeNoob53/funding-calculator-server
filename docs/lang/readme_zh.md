# 资金费率计算器服务器

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-ISC-blue.svg)
![GitHub Issues](https://img.shields.io/github/issues/CodeNoob53/funding-calculator-server.svg)

**资金费率计算器服务器**是一个强大的代理服务器，设计用于与Coinglass API接口交互，提供加密货币市场的实时资金费率数据。它作为资金计算器应用程序的后端，提供HTTP和WebSocket接口用于数据检索和实时更新。使用Node.js、Express和Socket.IO构建，该服务器确保高性能、可扩展性和可靠性。

## 概述

该服务器充当Coinglass API和客户端应用程序之间的桥梁，缓存数据以减少API调用，并通过WebSocket提供实时更新。它包括API密钥认证、速率限制、Prometheus监控和结构化日志记录等功能，便于维护和调试。

有关详细文档，包括架构、配置、API端点和WebSocket事件，请参阅[完整文档](../doc.md)。

## 功能特点

- 代理访问Coinglass API获取资金费率数据。
- 通过WebSocket提供实时数据更新，具有智能变更检测。
- 内存缓存优化性能。
- API密钥认证确保安全访问。
- 高级WebSocket功能，包括：
  - 自定义心跳监控
  - 连接统计跟踪
  - 延迟测量
  - 选择性数据订阅
- 速率限制防止滥用。
- Prometheus指标用于性能监控。
- 使用Winston进行结构化日志记录。
- 在终止信号时优雅关闭。

## 前提条件

- **Node.js**：版本18.0.0或更高。
- **npm**：版本8.0.0或更高（或Yarn）。
- **Coinglass API密钥**：访问资金费率数据所必需。
- **Git**（可选，用于克隆仓库）。

## 安装

1. **克隆仓库**：
   ```bash
   git clone https://github.com/CodeNoob53/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **设置环境**：
   - 复制`.env.example`文件到`.env`：
     ```bash
     cp .env.example .env
     ```
   - 使用您的Coinglass API密钥和其他设置编辑`.env`（参见[配置](../doc.md#configuration)）。

4. **创建日志目录**：
   ```bash
   mkdir logs
   ```

## 运行服务器

### 开发模式
使用`nodemon`运行服务器，自动重启：
```bash
npm run dev
```

### 生产模式
在生产环境中运行服务器：
```bash
npm start
```

服务器将在指定端口上启动（默认：`3001`）。检查控制台确认日志：
```
[HH:mm:ss] INFO   Server running on port 3001
```

## WebSocket客户端示例

有关WebSocket客户端实现的详细示例，请参阅文档中的[WebSocket事件](../doc.md#websocket客户端示例)部分。

## 配置

服务器通过`.env`文件中的环境变量进行配置。有关变量及其默认值的详细列表，请参阅文档中的[配置](../doc.md#configuration)部分。

## 贡献

我们欢迎贡献以增强资金费率计算器服务器！请遵循以下步骤：

1. Fork仓库。
2. 创建功能分支：
   ```bash
   git checkout -b feature/your-feature
   ```
3. 提交更改：
   ```bash
   git commit -m "Add your feature"
   ```
4. 推送到分支：
   ```bash
   git push origin feature/your-feature
   ```
5. 打开拉取请求。

请遵守行为准则，确保所有更改都有良好的文档记录。

## 许可证

本项目采用**ISC许可证**。详情请参阅[LICENSE](LICENSE)文件。

## 支持

如果您遇到问题或有疑问，请在[GitHub Issues页面](https://github.com/CodeNoob53/funding-calculator-server/issues)上开一个issue。

## 致谢

- 感谢Coinglass团队提供API。
- 使用Node.js、Express和Socket.IO用爱构建。

---

*最后更新：2025年5月*