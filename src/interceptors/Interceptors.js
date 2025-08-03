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

import { breadcrumbStore } from '../core/breadcrumbs/BreadcrumbStore.js';
import { agent } from '../core/agent/Agent.js';
import { contextCollector } from '../core/context/ContextCollector.js';

/**
 * Interceptors - Observadores que capturan eventos automáticamente
 * Implementa Chaining Pattern para coexistir con otros APMs
 */
export class Interceptors {
  constructor() {
    this.isInitialized = false;
    this.config = {
      captureClicks: true,
      captureFetch: true,
      captureErrors: true,
      captureUnhandledRejections: true
    };
    this.contextTypes = [];
        
    // Referencias originales para restaurar en destroy()
    this.originalHandlers = {
      fetch: null,
      onerror: null,
      onunhandledrejection: null
    };
        
    // Event listeners para limpiar
    this.eventListeners = new Map();
  }

  /**
     * Configura los interceptores
     * @param {Object} config - Configuración de interceptores
     */
  configure(config) {
    this.config = { ...this.config, ...config };
    this.contextTypes = config.context || [];
  }

  /**
     * Inicializa todos los interceptores
     */
  init() {
    if (this.isInitialized) {
      console.warn('SyntropyFront: Interceptors ya están inicializados');
      return;
    }

    if (this.config.captureClicks) {
      this.setupClickInterceptor();
    }

    if (this.config.captureFetch) {
      this.setupFetchInterceptor();
    }

    if (this.config.captureErrors || this.config.captureUnhandledRejections) {
      this.setupErrorInterceptors();
    }

    this.isInitialized = true;
    console.log('SyntropyFront: Interceptors inicializados con Chaining Pattern');
  }

  /**
     * Intercepta clics de usuario
     */
  setupClickInterceptor() {
    // Solo configurar en el browser
    if (typeof document === 'undefined') {
      console.log('SyntropyFront: Click interceptor no disponible (no browser)');
      return;
    }

    const clickHandler = (event) => {
      const el = event.target;
      if (!el) return;
            
      // Genera un selector CSS simple para identificar el elemento
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += `#${el.id}`;
      } else if (el.className && typeof el.className === 'string') {
        selector += `.${el.className.split(' ').filter(Boolean).join('.')}`;
      }

      breadcrumbStore.add({
        category: 'ui',
        message: `Usuario hizo click en '${selector}'`,
        data: {
          selector,
          tagName: el.tagName,
          id: el.id,
          className: el.className
        }
      });
    };

    // Guardar referencia para limpiar después
    this.eventListeners.set('click', clickHandler);
    document.addEventListener('click', clickHandler, true);
  }

  /**
     * Intercepta llamadas de red (fetch) con Chaining
     */
  setupFetchInterceptor() {
    // Solo configurar en el browser
    if (typeof window === 'undefined' || !window.fetch) {
      console.log('SyntropyFront: Fetch interceptor no disponible (no browser/fetch)');
      return;
    }

    // Guardar referencia original
    this.originalHandlers.fetch = window.fetch;
        
    // Crear nuevo handler que encadena con el original
    const syntropyFetchHandler = (...args) => {
      const url = args[0] instanceof Request ? args[0].url : args[0];
      const method = args[0] instanceof Request ? args[0].method : (args[1]?.method || 'GET');
            
      breadcrumbStore.add({
        category: 'network',
        message: `Request: ${method} ${url}`,
        data: {
          url,
          method,
          timestamp: Date.now()
        }
      });

      // ✅ CHAINING: Llamar al handler original
      return this.originalHandlers.fetch.apply(window, args);
    };

    // Sobrescribir con el nuevo handler
    window.fetch = syntropyFetchHandler;
  }

  /**
     * Intercepta errores globales con Chaining
     */
  setupErrorInterceptors() {
    // Solo configurar en el browser
    if (typeof window === 'undefined') {
      console.log('SyntropyFront: Error interceptors no disponibles (no browser)');
      return;
    }

    if (this.config.captureErrors) {
      // Guardar referencia original
      this.originalHandlers.onerror = window.onerror;
            
      // Crear nuevo handler que encadena con el original
      const syntropyErrorHandler = (message, source, lineno, colno, error) => {
        const errorPayload = {
          type: 'uncaught_exception',
          error: { 
            message, 
            source, 
            lineno, 
            colno, 
            stack: error?.stack 
          },
          breadcrumbs: breadcrumbStore.getAll(),
          timestamp: new Date().toISOString()
        };

        this.handleError(errorPayload);
                
        // ✅ CHAINING: Llamar al handler original si existe
        if (this.originalHandlers.onerror) {
          try {
            return this.originalHandlers.onerror(message, source, lineno, colno, error);
          } catch (originalError) {
            console.warn('SyntropyFront: Error en handler original:', originalError);
            return false;
          }
        }
                
        return false; // No prevenir el error por defecto
      };

      // Sobrescribir con el nuevo handler
      window.onerror = syntropyErrorHandler;
    }

    if (this.config.captureUnhandledRejections) {
      // Guardar referencia original
      this.originalHandlers.onunhandledrejection = window.onunhandledrejection;
            
      // Crear nuevo handler que encadena con el original
      const syntropyRejectionHandler = (event) => {
        const errorPayload = {
          type: 'unhandled_rejection',
          error: {
            message: event.reason?.message || 'Rechazo de promesa sin mensaje',
            stack: event.reason?.stack,
          },
          breadcrumbs: breadcrumbStore.getAll(),
          timestamp: new Date().toISOString()
        };

        this.handleError(errorPayload);
                
        // ✅ CHAINING: Llamar al handler original si existe
        if (this.originalHandlers.onunhandledrejection) {
          try {
            this.originalHandlers.onunhandledrejection(event);
          } catch (originalError) {
            console.warn('SyntropyFront: Error en handler original de rejection:', originalError);
          }
        }
      };

      // Sobrescribir con el nuevo handler
      window.onunhandledrejection = syntropyRejectionHandler;
    }
  }

  /**
     * Maneja los errores capturados
     * @param {Object} errorPayload - Payload del error
     */
  handleError(errorPayload) {
    // Recolectar contexto si está configurado
    const context = this.contextTypes.length > 0 ? contextCollector.collect(this.contextTypes) : null;
        
    // Enviar al agent si está configurado
    agent.sendError(errorPayload, context);
        
    // Callback para manejo personalizado de errores
    if (this.onError) {
      this.onError(errorPayload);
    } else {
      // Comportamiento por defecto: log a consola
      console.error('SyntropyFront - Error detectado:', errorPayload);
    }
  }

  /**
     * Desactiva todos los interceptores y restaura handlers originales
     */
  destroy() {
    if (!this.isInitialized) return;

    console.log('SyntropyFront: Limpiando interceptores...');

    // ✅ RESTAURAR: Handlers originales
    if (this.originalHandlers.fetch) {
      window.fetch = this.originalHandlers.fetch;
      console.log('SyntropyFront: fetch original restaurado');
    }

    if (this.originalHandlers.onerror) {
      window.onerror = this.originalHandlers.onerror;
      console.log('SyntropyFront: onerror original restaurado');
    }

    if (this.originalHandlers.onunhandledrejection) {
      window.onunhandledrejection = this.originalHandlers.onunhandledrejection;
      console.log('SyntropyFront: onunhandledrejection original restaurado');
    }

    // ✅ LIMPIAR: Event listeners
    if (typeof document !== 'undefined') {
      this.eventListeners.forEach((handler, eventType) => {
        document.removeEventListener(eventType, handler, true);
        console.log(`SyntropyFront: Event listener ${eventType} removido`);
      });
    }

    // Limpiar referencias
    this.originalHandlers = {
      fetch: null,
      onerror: null,
      onunhandledrejection: null
    };
    this.eventListeners.clear();
    this.isInitialized = false;

    console.log('SyntropyFront: Interceptors destruidos y handlers restaurados');
  }

  /**
     * Obtiene información sobre los handlers originales
     * @returns {Object} Información de handlers
     */
  getHandlerInfo() {
    return {
      isInitialized: this.isInitialized,
      hasOriginalFetch: !!this.originalHandlers.fetch,
      hasOriginalOnError: !!this.originalHandlers.onerror,
      hasOriginalOnUnhandledRejection: !!this.originalHandlers.onunhandledrejection,
      eventListenersCount: this.eventListeners.size
    };
  }
}

// Instancia singleton
export const interceptors = new Interceptors(); 