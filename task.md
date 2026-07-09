# Lista de Tareas - OnAlert Distributed Refactor (Completado)

## [x] Backend Infrastructure (Nube)
- [x] Crear `backend/docker-compose.yml` con PostgreSQL, MongoDB y RabbitMQ.
- [x] Configurar variables de entorno y scripts de inicio (package.json global y archivos .env).

## [x] Backend Microservices
- [x] Crear `backend/gateway` (API Gateway Express con validación de JWT y ruteo).
- [x] Crear `backend/user-service` (Express, PostgreSQL, Sequelize/TypeORM, JWT Auth, lógica multi-inquilino).
- [x] Crear `backend/incident-service` (Express, MongoDB, Mongoose, 2dsphere geo-index, publicador RabbitMQ).
- [x] Crear `backend/alert-service` (Consumer de RabbitMQ, notificador simulado/push).

## [x] Mobile App - Clean Architecture Refactoring
- [x] Reestructurar directorios de la app en `domain`, `application`, `adapters`, `infrastructure`.
- [x] Crear Entidades de Dominio (definidas en types/index.ts).
- [x] Crear Casos de Uso (`ActivateEmergencyButton`, `ReportIncident`, `SyncOfflineData`) en `application/usecases/`.

## [x] Mobile App - Distributed Concepts
- [x] Implementar `utils/lamportClock.ts` (Relojes lógicos de Lamport).
- [x] Implementar `utils/timeSync.ts` (Sincronización física NTP / Dual timestamps).
- [x] Implementar `utils/namingService.ts` (DHT resolver simulado para nodos).
- [x] Implementar `services/p2pNode.ts` (Nodo local WebSocket para comunicación Mesh offline y consenso).

## [x] Integration and Testing
- [x] Conectar `AlertContext.tsx` con el gateway y el servicio P2P.
- [x] Solucionar error de bundling web de `react-native-maps` mediante la separación de componentes Web y Native (`components/MapComponent.tsx`).
- [x] Realizar pruebas locales e integración completa lista para demostración.
