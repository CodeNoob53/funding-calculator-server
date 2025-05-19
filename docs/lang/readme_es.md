# Servidor de Calculadora de Financiación

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-ISC-blue.svg)
![GitHub Issues](https://img.shields.io/github/issues/CodeNoob53/funding-calculator-server.svg)

El **Servidor de Calculadora de Financiación** es un robusto servidor proxy diseñado para interactuar con la API de Coinglass, proporcionando datos de tasas de financiación en tiempo real para mercados de criptomonedas. Sirve como backend para una aplicación de calculadora de financiación, ofreciendo interfaces HTTP y WebSocket para la recuperación de datos y actualizaciones en vivo. Construido con Node.js, Express y Socket.IO, este servidor garantiza alto rendimiento, escalabilidad y fiabilidad.

## Visión General

Este servidor actúa como un puente entre la API de Coinglass y las aplicaciones cliente, almacenando datos en caché para reducir las llamadas a la API y entregando actualizaciones en tiempo real a través de WebSocket. Incluye características como autenticación por clave API, limitación de velocidad, monitoreo con Prometheus y registro estructurado para facilitar el mantenimiento y la depuración.

Para documentación detallada, incluyendo arquitectura, configuración, endpoints de API y eventos WebSocket, consulte la [documentación completa](../doc.md).

## Características

- Acceso proxy a la API de Coinglass para datos de tasas de financiación.
- Actualizaciones de datos en tiempo real a través de WebSocket con detección inteligente de cambios.
- Almacenamiento en caché en memoria para optimización del rendimiento.
- Autenticación por clave API para acceso seguro.
- Características avanzadas de WebSocket incluyendo:
  - Monitoreo personalizado de heartbeat
  - Seguimiento de estadísticas de conexión
  - Medición de latencia
  - Suscripción selectiva de datos
- Limitación de velocidad para prevenir abusos.
- Métricas de Prometheus para monitoreo del rendimiento.
- Registro estructurado con Winston.
- Cierre elegante ante señales de terminación.

## Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior.
- **npm**: Versión 8.0.0 o superior (o Yarn).
- **Clave API de Coinglass**: Requerida para acceder a los datos de tasas de financiación.
- **Git** (opcional, para clonar el repositorio).

## Instalación

1. **Clonar el Repositorio**:
   ```bash
   git clone https://github.com/CodeNoob53/funding-calculator-server.git
   cd funding-calculator-server
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   ```

3. **Configurar el Entorno**:
   - Copiar el archivo `.env.example` a `.env`:
     ```bash
     cp .env.example .env
     ```
   - Editar `.env` con tu clave API de Coinglass y otras configuraciones (ver [Configuración](../doc.md#configuration)).

4. **Crear Directorio de Logs**:
   ```bash
   mkdir logs
   ```

## Ejecutando el Servidor

### Modo Desarrollo
Ejecutar el servidor con reinicio automático usando `nodemon`:
```bash
npm run dev
```

### Modo Producción
Ejecutar el servidor en producción:
```bash
npm start
```

El servidor se iniciará en el puerto especificado (por defecto: `3001`). Verifica la consola para un mensaje de confirmación:
```
[HH:mm:ss] INFO   Server running on port 3001
```

## Ejemplo de Cliente WebSocket

Para un ejemplo detallado de implementación de cliente WebSocket, consulte la sección [Eventos WebSocket](../doc.md#ejemplo-de-cliente-websocket) en la documentación.

## Configuración

El servidor se configura a través de variables de entorno en el archivo `.env`. Consulte la sección [Configuración](../doc.md#configuration) en la documentación para una lista detallada de variables y sus valores predeterminados.

## Contribuir

¡Damos la bienvenida a contribuciones para mejorar el Servidor de Calculadora de Financiación! Por favor, siga estos pasos:

1. Haga un fork del repositorio.
2. Cree una rama de características:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Confirme sus cambios:
   ```bash
   git commit -m "Add your feature"
   ```
4. Envíe a la rama:
   ```bash
   git push origin feature/your-feature
   ```
5. Abra una solicitud de extracción.

Por favor, adhiérase al Código de Conducta y asegúrese de que todos los cambios estén bien documentados.

## Licencia

Este proyecto está licenciado bajo la **Licencia ISC**. Vea el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Si encuentra problemas o tiene preguntas, por favor abra un issue en la [página de Issues de GitHub](https://github.com/CodeNoob53/funding-calculator-server/issues).

## Agradecimientos

- Gracias al equipo de Coinglass por proporcionar la API.
- Construido con amor usando Node.js, Express y Socket.IO.

---

*Última actualización: mayo 2025*