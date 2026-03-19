# Manual Técnico - LabManager

**Versión:** 1.0
**Fecha:** 3 de Febrero de 2026
**Proyecto:** Sistema de Gestión de Laboratorios

---

## 1. Introducción
Este documento detalla los aspectos técnicos del desarrollo e implementación del sistema *LabManager*. Describe las herramientas utilizadas, la estructura del código, la configuración del entorno, la mensajería en tiempo real y la arquitectura de la base de datos en la nube. Su propósito es servir como guía para desarrolladores y administradores de sistemas.

## 2. Tecnologías Utilizadas (Stack Tecnológico)

### 2.1 Backend (Servidor)
*   **Lenguaje:** Java 17.
*   **Framework:** Spring Boot 3.2.0.
*   **Seguridad:** Spring Security + JWT (JSON Web Tokens).
*   **Tiempo Real:** Spring WebSocket + STOMP (Manejo de notificaciones en vivo a usuarios conectados).
*   **Persistencia:** Spring Data JPA + Hibernate (Uso de JPA Specifications para consultas dinámicas complejas).
*   **Base de Datos:** PostgreSQL en la nube (Hosteado en Supabase) para Producción.
*   **Herramientas:** Maven (Gestión de dependencias), Lombok.
*   **Reportes:** iText (PDF) y Apache POI (Excel).

### 2.2 Frontend (Cliente)
*   **Lenguaje:** TypeScript + React 18.
*   **Build Tool:** Vite.
*   **Estilos:** TailwindCSS (Diseño Utility-First) con soporte nativo de Modo Oscuro.
*   **Librerías Clave:**
    *   `axios`: Consumo de API REST.
    *   `sockjs-client` y `@stomp/stompjs`: Comunicación bidireccional por WebSockets.
    *   `react-router-dom`: Navegación SPA.
    *   `react-hook-form`: Gestión de formularios.
    *   `lucide-react`: Iconografía SVG ligera.
    *   `recharts`: Gráficos de analíticas dinámicos.
    *   `react-qr-code`: Generación de códigos QR de estado para reservas.
    *   `@yudiel/react-qr-scanner`: Escaneo en tiempo real usando APIs modernas del navegador (MediaDevices).
    *   `date-fns`: Manejo robusto de fechas adaptado al formato ISO.

---

## 3. Arquitectura del Sistema

El sistema sigue una **Arquitectura en Capas** clásica para asegurar la separación de responsabilidades:

1.  **Capa de Presentación (Frontend):** Interfaz de usuario React que consume servicios REST y WebSocket.
    *   *Sincronización en vivo:* Hook personalizado `useWebSocket` escucha notificaciones del Broker configurado sobre STOMP.
    *   *Manejo Offline:* `OfflineManager` encola mutaciones (POST, PUT) en LocalStorage cuando no hay red (ServiceWorker interceptors).
2.  **Capa de Controladores (Controller):** Recibe peticiones HTTP (`GET`, `POST`, etc.) y valida entradas.
    *   *Manejo de Errores:* `GlobalExceptionHandler` unifica las respuestas de error a estándar JSON.
3.  **Capa de Servicio (Service):** Contiene la lógica de negocio pura.
    *   *Mensajería:* `NotificationService` acopla eventos de MongoDB/JPA (Cambios de status de un Laptop) y ejecuta `SimpMessagingTemplate` para enviar la capa de Websocket.
4.  **Capa de Acceso a Datos (Repository):** Interactúa con la base de datos PostgreSQL.
    *   *Resolución n+1:* Uso de `LEFT JOIN FETCH` y constructores dinámicos (`Specification`) en JPQL para reducir consultas y mejorar rendimiento de CPU al procesar Reportes.
5.  **Capa de Datos (Database):** Tablas Relacionales en PostgreSQL (Supabase / DigitalOcean pooling).

---

## 4. Estructura del Proyecto

### 4.1 Backend (`/src/main/java/com/university/labmanager`)
*   `config/`: Configuraciones de Security, Beans de CORS y el `WebSocketConfig` (que define el registry en `/ws`).
*   `controller/`: Endpoints de la API REST separando recursos como `/api/laptops` o `/api/reports`.
*   `model/`: Entidades JPA representando el dominio.
*   `repository/`: Interfaces CRUD que extienden JPA Repository y Specifications.
*   `service/`: Donde ocurre validación inteligente (Ej: Asignar laptops óptimas basándose en RAM/Software instalado).
*   `dto/`: Transferencia optimizada sin exponer entidades Hibernate directas.

### 4.2 Frontend (`/src`)
*   `components/`: Componentes encapsulados que consumen interfaces como `ThemeContext`.
*   `pages/`: Pantallas principales de navegación y Dashboards en Grid layout.
*   `hooks/`: Lógicas auto-contenidas (`useWebSocket.ts`, `useAuth.ts`).
*   `services/`: Encapsulamiento del middleware Axios.

---

## 5. Implementación de Módulos Clave

### 5.1 Comunicación en Tiempo Real (Notificaciones)
LabManager ahora no depende de recargas manuales (Polling). El sistema notifica al administrador en caso de robos, averías o cuando un estudiante pide equipo; asimismo al estudiante se le notifica en el nanosegundo en que su reserva es aprobada para que genere el QR visual en su pantalla, usando un `MessageBroker`.

### 5.2 Módulo Inteligente de Reservas
*   El backend usa el motor de base de datos para buscar equipos libres (restringiendo fechas, días de la semana y horas laborables de 7am a 9pm).
*   Los reportes de este módulo utilizan consultas paramétricas altamente dinámicas (`Specification<Reservation>`) que eluden fallos de tipado sobre `NULL` en Dialectos PostgreSQL agresivos.

### 5.3 Módulo de Incidentes (Archivos y Evidencias)
Acepta fotografías de campo en formato multi-part. DigitalOcean Storage / Directorios estáticos en red alojan físicamente la evidencia que luego el administrador procesa.

---

## 6. Instalación y Despliegue

El despliegue ha sido optimizado para la nube (Cloud-Native):

1. **Base de Datos:** Postgresql Pooling vía Supavisor.
2. **Backend (App Platform / DigitalOcean):** Se provee al contenedor variables de entorno `JDBC_DATABASE_URL`, permitiendo que Hibernate actualice DDL/Esquemas con auto-update asegurado.
3. **Frontend (Vercel / DO / Heroku):** Vite compila los estáticos con minimización extrema que posteriormente Nginx sirve velozmente al navegador del cliente HTTP.

---

## 7. Conclusión
LabManager representa un puente sólido entre administración y telemetría de activos informáticos, impulsado por notificaciones interactivas, seguridad JWT e integraciones estables que escalan sobre infraestrucutras IaaS / PaaS.
