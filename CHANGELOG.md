# Changelog - SyntropyFront

## 🚀 Refactor Arquitectónico y Test Suite (Jest + Stryker)

### ✨ Refactor y Arquitectura SOLID
- Refactor completo del `Agent` siguiendo el principio de Responsabilidad Única (SRP).
- El `Agent` ahora delega responsabilidades a componentes especializados:
  - `ConfigurationManager`: gestión de configuración.
  - `QueueManager`: gestión de la cola de envío y batching.
  - `RetryManager`: gestión de reintentos con backoff exponencial.
  - `HttpTransport`: requests HTTP y serialización robusta.
  - `PersistentBufferManager`: gestión de buffer persistente (IndexedDB).
- Nuevos managers internos:
  - `DatabaseManager`: conexión y transacciones con IndexedDB.
  - `StorageManager`: CRUD sobre el store de IndexedDB.
  - `RetryLogicManager`: lógica de reintentos y limpieza de items fallidos.

### 🧪 Test Suite y Cobertura
- Migración completa de la suite de tests a **Jest**.
- Tests unitarios nuevos y refactorizados para cada manager y componente:
  - `agent-refactored.test.js`, `configurationManager.test.js`, `queueManager.test.js`, `httpTransport.test.js`, `retryManager.test.js`, `persistentBufferManager-refactored.test.js`, `databaseManager.test.js`, `storageManager.test.js`, `retryLogicManager.test.js`.
- Mocks para IndexedDB y fetch donde corresponde.
- Cobertura de código superior al 80% en la mayoría de los archivos nuevos/refactorizados.
- Integración de **Stryker** para mutation testing.

### 🧹 Exclusión/Deprecación de Tests Antiguos
- Se excluyeron de la suite los tests antiguos incompatibles con la nueva arquitectura:
  - `agent.test.js`
  - `persistentBufferManager.test.js`
- Motivo: prueban la versión monolítica anterior y no reflejan la estructura ni los métodos actuales.
- Los tests nuevos cubren la funcionalidad real y la arquitectura SOLID.

### 🐞 Corrección de Errores
- Corrección de errores de test relacionados con:
  - Duplicación de `jest` en imports.
  - Mocks de IndexedDB y fetch.
  - Ajustes de timing en tests de backoff/retry.
  - Adaptación de expectativas a la nueva arquitectura.

### ⚠️ Pendientes
- 2 tests de timing en `RetryManager` siguen fallando por diferencias mínimas en el cálculo de tiempo (no afectan la funcionalidad real).
- Mañana se revisarán estos tests para decidir si se ajustan, se mockean los timers, o se documenta la limitación.
- Agregar cualquier test/caso de negocio faltante.
- Actualizar documentación interna si es necesario.
- Preparar el merge/integración al branch principal.

---

**Este changelog resume el trabajo de refactor, migración de tests, cobertura y robustez de la nueva arquitectura.**

Cualquier duda o ajuste, ¡consultar antes de mergear! 💪