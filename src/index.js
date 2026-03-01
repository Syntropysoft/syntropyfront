/**
 * Copyright 2024 Syntropysoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * SyntropyFront - Biblioteca de observabilidad con captura automática
 * Actúa como Facade conectando el Agent y los Interceptors modulares
 */
import { breadcrumbStore } from './core/breadcrumbs/BreadcrumbStore.js';
import { agent } from './core/agent/Agent.js';
import { interceptors } from './interceptors/Interceptors.js';

class SyntropyFront {
  constructor() {
    this.isActive = false;
    this.config = {
      maxEvents: 50,
      endpoint: null,
      headers: {},
      usePersistentBuffer: true,
      captureClicks: true,
      captureFetch: true,
      captureErrors: true,
      captureUnhandledRejections: true,
      onError: null
    };

    // Auto-inicializar
    this.init();
  }

  /**
   * Inicializa la biblioteca y activa los interceptores
   */
  init() {
    if (this.isActive) return;

    // Configurar el agent por defecto
    agent.configure({
      endpoint: this.config.endpoint,
      headers: this.config.headers,
      usePersistentBuffer: this.config.usePersistentBuffer
    });

    // Inicializar interceptores
    interceptors.configure({
      captureClicks: this.config.captureClicks,
      captureFetch: this.config.captureFetch,
      captureErrors: this.config.captureErrors,
      captureUnhandledRejections: this.config.captureUnhandledRejections
    });

    // Inyectar callback de error si existe
    if (this.config.onError) {
      interceptors.onError = this.config.onError;
    }

    interceptors.init();

    // Intentar reintentar items fallidos de sesiones previas
    agent.retryFailedItems().catch(err => {
      console.warn('SyntropyFront: Error al intentar recuperar items persistentes:', err);
    });

    this.isActive = true;
    console.log('🚀 SyntropyFront: Inicializado con arquitectura modular resiliente');
  }

  /**
   * Configura SyntropyFront
   * @param {Object} config - Configuración
   */
  configure(config = {}) {
    // Actualizar configuración local
    this.config = { ...this.config, ...config };

    // Si se pasa 'fetch', extraer endpoint y headers por compatibilidad
    if (config.fetch) {
      this.config.endpoint = config.fetch.url;
      this.config.headers = config.fetch.options?.headers || {};
    }

    // Re-configurar componentes internos
    agent.configure({
      endpoint: this.config.endpoint,
      headers: this.config.headers,
      usePersistentBuffer: this.config.usePersistentBuffer
    });

    interceptors.configure({
      captureClicks: this.config.captureClicks,
      captureFetch: this.config.captureFetch,
      captureErrors: this.config.captureErrors,
      captureUnhandledRejections: this.config.captureUnhandledRejections
    });

    if (this.config.onError) {
      interceptors.onError = this.config.onError;
    }

    const mode = this.config.endpoint ? `endpoint: ${this.config.endpoint}` : 'console only';
    console.log(`✅ SyntropyFront: Configurado - ${mode}`);
  }

  /**
   * Añade un breadcrumb manualmente
   */
  addBreadcrumb(category, message, data = {}) {
    return breadcrumbStore.add({ category, message, data });
  }

  /**
   * Obtiene todos los breadcrumbs
   */
  getBreadcrumbs() {
    return breadcrumbStore.getAll();
  }

  /**
   * Limpia los breadcrumbs
   */
  clearBreadcrumbs() {
    breadcrumbStore.clear();
  }

  /**
   * Envía un error manualmente con contexto
   */
  sendError(error, context = {}) {
    const errorPayload = {
      type: 'manual_error',
      error: {
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: error.stack
      },
      breadcrumbs: this.getBreadcrumbs(),
      timestamp: new Date().toISOString()
    };

    agent.sendError(errorPayload, context);
    return errorPayload;
  }

  /**
   * Fuerza el envío de datos pendientes
   */
  async flush() {
    await agent.forceFlush();
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats() {
    return {
      isActive: this.isActive,
      breadcrumbs: breadcrumbStore.count(),
      agent: agent.getStats(),
      config: { ...this.config }
    };
  }

  /**
   * Desactiva la biblioteca y restaura hooks originales
   */
  destroy() {
    interceptors.destroy();
    agent.disable();
    this.isActive = false;
    console.log('SyntropyFront: Desactivado');
  }
}

// Instancia única (Singleton)
const syntropyFront = new SyntropyFront();

// Exportar la instancia por defecto
export default syntropyFront;