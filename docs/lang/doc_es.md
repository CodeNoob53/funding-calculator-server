# Servidor de Calculadora de Financiación

El Servidor de Calculadora de Financiación es un robusto servidor proxy diseñado para interactuar con la API de Coinglass, proporcionando datos de tasas de financiación en tiempo real para mercados de criptomonedas. Sirve como backend para una aplicación de calculadora de financiación, ofreciendo interfaces HTTP y WebSocket para la recuperación de datos y actualizaciones en vivo. Construido con Node.js, Express y Socket.IO, el servidor garantiza alto rendimiento, escalabilidad y fiabilidad.

## Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecutando el Servidor](#ejecutando-el-servidor)
- [Endpoints de API](#endpoints-de-api)
- [Eventos WebSocket](#eventos-websocket)
- [Monitoreo y Registro](#monitoreo-y-registro)
- [Seguridad](#seguridad)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Características

- **Proxy para API de Coinglass**: Obtiene y almacena en caché datos de tasas de financiación de Coinglass.
- **Actualizaciones en Tiempo Real**: Entrega actualizaciones de tasas de financiación en vivo a través de WebSocket.
- **Almacenamiento en Caché**: Utiliza caché en memoria para reducir llamadas a la API.
- **Limitación de Velocidad**: Protege contra abusos con `express-rate-limit`.
- **Registro Estructurado**: Registros a archivos y consola usando `winston` para fácil depuración y monitoreo.
- **Monitoreo de Rendimiento**: Expone métricas a través de Prometheus en `/metrics`.
- **Autenticación por Clave API**: Asegura endpoints usando una clave API en el encabezado de la solicitud.
- **Cierre Elegante**: Maneja señales de terminación para un apagado limpio del servidor.
- **Arquitectura Modular**: Estructura de código organizada para escalabilidad y mantenibilidad.

## Arquitectura

El servidor está estructurado como una aplicación Node.js modular con los siguientes componentes:

- **Servidor Express** (`src/server/index.js`): Maneja solicitudes HTTP y sirve como API principal.
- **Socket.IO** (`src/server/socket.js`): Gestiona conexiones WebSocket para actualizaciones de datos en tiempo real.
- **Rutas** (`src/routes/`): Enrutamiento modular para endpoints de API:
  - `/api/proxy/funding-rates`: Obtiene datos de tasas de financiación.
- **Caché** (`src/routes/fundingRates.js`): Caché en memoria para recuperación eficiente de datos.
- **Registro** (`src/utils/logger.js`): Registro estructurado con `winston` a `logs/app.log`.
- **Configuración** (`src/config/index.js`): Configuración centralizada usando variables de entorno.
- **Middlewares** (`src/middlewares/`): Middleware reutilizable para autenticación, limitación de velocidad y métricas.
- **Punto de Entrada** (`src/app.js`): Inicialización del servidor principal y lógica de cierre elegante.

## Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior.
- **npm**: Versión 8.0.0 o superior (o `yarn`).
- **Clave API de Coinglass**: Requerida para acceder a datos de tasas de financiación.
- **Git**: Para clonar el repositorio (opcional).

## Instalación

1. **Clonar el Repositorio**:
   ```bash
   git clone https://github.com/your-repo/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   ```

3. **Crear Archivo de Entorno**:
   Copiar el archivo `.env.example` a `.env` y completar los valores requeridos:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tu clave API de Coinglass y otras configuraciones (ver [Configuración](#configuración)).

4. **Crear Directorio de Logs**:
   ```bash
   mkdir logs
   ```

## Configuración

El servidor se configura a través de variables de entorno definidas en el archivo `.env`. A continuación se muestra un ejemplo basado en `.env.example`:

```
# Clave API de Coinglass para acceder a tasas de financiación
API_KEY=your_coinglass_api_key

# URL de API de Coinglass
COINGLASS_API_URL=https://open-api.coinglass.com/public/v2/funding

# URL del cliente para CORS (por ejemplo, tu aplicación frontend)
CLIENT_URL=https://your-client-app.com

# Puerto del servidor
PORT=3001

# Intervalo de actualización de datos de financiación en milisegundos
FUNDING_UPDATE_INTERVAL=20000

# Tiempo de espera de ping WebSocket en milisegundos
SOCKET_PING_TIMEOUT=60000

# Intervalo de ping WebSocket en milisegundos
SOCKET_PING_INTERVAL=25000

# Configuración de registro
LOG_LEVEL=info
LOG_COLORS=true
LOG_TO_FILE=true
```

### Detalles de Configuración

- **API_KEY**: Tu clave API de Coinglass (requerida).
- **COINGLASS_API_URL**: El endpoint de API de Coinglass para tasas de financiación (predeterminado: `https://open-api.coinglass.com/`).
- **CLIENT_URL**: La URL del frontend para CORS (por ejemplo, `https://your-client-app.com`).
- **PORT**: El puerto en el que se ejecuta el servidor (predeterminado: `3001`).
- **FUNDING_UPDATE_INTERVAL**: Intervalo para actualizar datos de financiación en milisegundos (predeterminado: `20000`).
- **SOCKET_PING_TIMEOUT**: Tiempo de espera de ping WebSocket en milisegundos (predeterminado: `60000`).
- **SOCKET_PING_INTERVAL**: Intervalo de ping WebSocket en milisegundos (predeterminado: `25000`).
- **LOG_LEVEL**: Nivel de registro (`error`, `info`, `debug`, etc.; predeterminado: `info`).
- **LOG_COLORS**: Habilitar logs coloreados en la consola (`true` o `false`; predeterminado: `true`).
- **LOG_TO_FILE**: Habilitar registro a archivo (`true` o `false`; predeterminado: `true`).

## Ejecutando el Servidor

### Modo Desarrollo (con `nodemon` para auto-reinicio):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor se iniciará en el `PORT` especificado (predeterminado: `3001`). Deberías ver un mensaje de log:
```
[HH:mm:ss] INFO   Server running on port 3001
```

## Endpoints de API

### `GET /`
- **Descripción**: Endpoint de verificación de salud.
- **Respuesta**:
  ```
  Funding Server is running...
  ```

### `GET /api/proxy/funding-rates`
- **Descripción**: Obtiene datos de tasas de financiación de Coinglass, con agrupación, filtrado y almacenamiento en caché en memoria. La caché se actualiza automáticamente cada `FUNDING_UPDATE_INTERVAL` ms.
- **Encabezados**:
  - `x-api-key: <your_api_key>` (requerido).
- **Parámetros de Consulta**:
  - `symbol` (opcional): Devuelve datos solo para el símbolo especificado (por ejemplo, `BTC`).
  - `minRate` (opcional): Filtra exchanges por umbral absoluto de tasa de financiación.
- **Respuesta**:
  - **Éxito (200)**:
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
      "error": "No se pudieron obtener tasas de financiación de Coinglass",
      "details": "Error message"
    }
    ```

### `GET /metrics`
- **Descripción**: Expone métricas de Prometheus para monitoreo.
- **Respuesta**:
  Métricas compatibles con Prometheus (por ejemplo, `http_request_duration_seconds`).

## Eventos WebSocket

El servidor utiliza Socket.IO para actualizaciones de datos en tiempo real con características avanzadas como monitoreo personalizado de heartbeat, estadísticas de conexión y detección inteligente de cambios.

### Conexión
- **Evento**: `connection`
- **Autenticación**:
  Incluye tu clave API en el campo `auth.apiKey` del handshake de Socket.IO.
  ```javascript
  const socket = io('http://localhost:3001', {
    auth: { apiKey: 'your_api_key' }
  });
  ```

### Eventos

- **`initialData`**:
  - **Descripción**: Emitido tras una conexión exitosa.
  - **Carga**: Datos de tasas de financiación en caché.
  - **Ejemplo**:
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
  - **Descripción**: Emitido cada 20 segundos (configurable a través de `FUNDING_UPDATE_INTERVAL`) si los datos han cambiado.
  - **Carga**: Datos de tasas de financiación actualizados (mismo formato que `initialData`).
  - **Nota**: El servidor implementa un algoritmo inteligente de detección de cambios que solo envía datos modificados para reducir el uso de ancho de banda.

- **`ping`**:
  - **Descripción**: Heartbeat iniciado por el servidor para verificar la conectividad del cliente.
  - **Carga**: `{ timestamp: 1714828800000 }`
  - **Respuesta Esperada**: El cliente debe responder con un evento `pong` que contenga el mismo timestamp.

- **`pong`**:
  - **Descripción**: Respuesta del cliente al evento `ping` del servidor.
  - **Carga**: `{ timestamp: 1714828800000 }` (mismo timestamp recibido en el ping)
  - **Nota**: Utilizado para calcular la latencia de conexión y detectar clientes desconectados.

- **`subscribe`**:
  - **Descripción**: Evento del cliente para suscribirse a actualizaciones de tasas de financiación en tiempo real.
  - **Carga**: Ninguna
  - **Respuesta**: Ninguna, pero el cliente comenzará a recibir eventos `dataUpdate`.

- **`unsubscribe`**:
  - **Descripción**: Evento del cliente para dejar de recibir actualizaciones de tasas de financiación.
  - **Carga**: Ninguna
  - **Respuesta**: Ninguna, el cliente dejará de recibir eventos `dataUpdate`.

- **`getConnectionStats`**:
  - **Descripción**: Solicitud del cliente para estadísticas de conexión.
  - **Carga**: Ninguna
  - **Respuesta**: Evento `connectionStats` con métricas detalladas de conexión.

- **`connectionStats`**:
  - **Descripción**: Respuesta del servidor con estadísticas de conexión.
  - **Carga**:
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
  - **Descripción**: Activado cuando un cliente se desconecta.
  - **Carga**: Razón de la desconexión (por ejemplo, `transport close`).

## Monitoreo y Registro

### Registro
Los logs se escriben en:
- `logs/app.log`: Todos los logs (info, error, etc.).
- **Consola**: Logs coloreados para desarrollo.

Formato de log:
- **Consola**: `[HH:mm:ss] LEVEL   Message`
  - Ejemplo: `[12:34:56] INFO   Server running on port 3001`
- **Archivo (JSON)**:
  ```json
  {
    "level": "info",
    "message": "Server running on port 3001",
    "timestamp": "2025-05-04 12:34:56.789"
  }
  ```

### Monitoreo
- Las métricas de Prometheus están disponibles en `/metrics`.
- Métricas clave:
  - `http_request_duration_seconds`: Duración de solicitudes HTTP.
  - Métricas predeterminadas de Node.js (por ejemplo, uso de CPU, memoria).
- Utiliza un servidor Prometheus y Grafana para visualización.

## Seguridad

- **Autenticación por Clave API**: Tanto las conexiones WebSocket como los endpoints `/api/proxy` requieren una clave API válida en el encabezado o handshake.
- **CORS**: Restringido al `CLIENT_URL` especificado.
- **Limitación de Velocidad**: Limita las solicitudes a `/api/proxy` a 100 por 15 minutos por IP.
- **Variables de Entorno**: Los datos sensibles (por ejemplo, `API_KEY`) deben definirse en `.env`.
- **Cierre Elegante**: Asegura una terminación limpia en `SIGTERM`.

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama de características (`git checkout -b feature/your-feature`).
3. Realiza cambios (`git commit -m 'Add your feature'`).
4. Envía a la rama (`git push origin feature/your-feature`).
5. Abre una solicitud de extracción.

Por favor, sigue el Código de Conducta y asegúrate de que todos los cambios estén bien documentados.

## Licencia

Este proyecto está licenciado bajo la Licencia ISC. Consulta el archivo `LICENSE` para más detalles.