module.exports = {
    cacheTTL: parseInt(process.env.CACHE_TTL) || 60,
    fundingUpdateInterval: parseInt(process.env.FUNDING_UPDATE_INTERVAL) || 20000,
    socketPingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
    socketPingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 10000
  };
  