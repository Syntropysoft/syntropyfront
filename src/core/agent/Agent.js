import { ConfigurationManager } from './ConfigurationManager.js';
import { QueueManager } from './QueueManager.js';
import { RetryManager } from '../retry/RetryManager.js';
import { HttpTransport } from './HttpTransport.js';
import { PersistentBufferManager } from '../persistent/PersistentBufferManager.js';

/**
 * Agent - Envía datos de trazabilidad al backend
 * Coordinador que usa componentes especializados para cada responsabilidad
 */
export class Agent {
  constructor() {
    // Componentes especializados
    this.config = new ConfigurationManager();
    this.queue = new QueueManager(this.config);
    this.retry = new RetryManager(this.config);
    this.transport = new HttpTransport(this.config);
    this.buffer = new PersistentBufferManager(this.config);
        
    // Configurar callbacks para coordinación
    this.setupCallbacks();
  }

  /**
     * Configura callbacks para coordinación entre componentes
     */
  setupCallbacks() {
    // Callback para el QueueManager cuando hace flush
    this.queue.flushCallback = async (items) => {
      try {
        await this.transport.send(items);
        console.log('SyntropyFront: Datos enviados exitosamente');
      } catch (error) {
        console.error('SyntropyFront Agent: Error enviando datos:', error);
                
        // Agregar a cola de reintentos
        this.retry.addToRetryQueue(items);
                
        // Guardar en buffer persistente
        await this.buffer.save(items);
      }
    };

    // Callback para el RetryManager cuando procesa reintentos
    this.retry.sendCallback = async (items) => {
      return await this.transport.send(items);
    };

    this.retry.removePersistentCallback = async (id) => {
      await this.buffer.remove(id);
    };

    // Callback para el PersistentBufferManager cuando retry items
    this.buffer.sendCallback = (items, retryCount, persistentId) => {
      this.retry.addToRetryQueue(items, retryCount, persistentId);
    };
  }



  /**
     * Configura el agent
     * @param {Object} config - Configuración del agent
     */
  configure(config) {
    this.config.configure(config);
  }

  /**
     * Envía un error al backend
     * @param {Object} errorPayload - Payload del error
     * @param {Object} context - Contexto adicional (opcional)
     */
  sendError(errorPayload, context = null) {
    if (!this.config.isAgentEnabled()) {
      console.warn('SyntropyFront Agent: No configurado, error no enviado');
      return;
    }

    // Agregar contexto si está disponible
    const payloadWithContext = context ? {
      ...errorPayload,
      context
    } : errorPayload;

    // Aplicar encriptación si está configurada
    const dataToSend = this.transport.applyEncryption(payloadWithContext);

    this.queue.add({
      type: 'error',
      data: dataToSend,
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Envía breadcrumbs al backend
     * @param {Array} breadcrumbs - Lista de breadcrumbs
     */
  sendBreadcrumbs(breadcrumbs) {
    // Solo enviar breadcrumbs si está habilitado (batchTimeout configurado)
    if (!this.config.isAgentEnabled() || !this.config.shouldSendBreadcrumbs() || !breadcrumbs.length) {
      return;
    }

    // Aplicar encriptación si está configurada
    const dataToSend = this.transport.applyEncryption(breadcrumbs);

    this.queue.add({
      type: 'breadcrumbs',
      data: dataToSend,
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Añade un item a la cola de envío (método público para compatibilidad)
     * @param {Object} item - Item a añadir
     */
  addToQueue(item) {
    this.queue.add(item);
  }

  /**
     * Añade items a la cola de reintentos (método público para compatibilidad)
     * @param {Array} items - Items a reintentar
     * @param {number} retryCount - Número de reintento
     * @param {number} persistentId - ID en buffer persistente (opcional)
     */
  addToRetryQueue(items, retryCount = 1, persistentId = null) {
    this.retry.addToRetryQueue(items, retryCount, persistentId);
  }

  /**
     * Procesa la cola de reintentos (método público para compatibilidad)
     */
  async processRetryQueue() {
    await this.retry.processRetryQueue(
      this.retry.sendCallback,
      this.retry.removePersistentCallback
    );
  }

  /**
     * Envía todos los items en cola
     */
  async flush() {
    await this.queue.flush(this.queue.flushCallback);
  }

  /**
     * Fuerza el envío inmediato de todos los datos pendientes
     */
  async forceFlush() {
    await this.flush();
        
    // También intentar enviar items en cola de reintentos
    if (!this.retry.isEmpty()) {
      console.log('SyntropyFront: Intentando enviar items en cola de reintentos...');
      await this.processRetryQueue();
    }
  }

  /**
     * Obtiene estadísticas del agent
     * @returns {Object} Estadísticas
     */
  getStats() {
    const config = this.config.getConfig();
    return {
      queueLength: this.queue.getSize(),
      retryQueueLength: this.retry.getSize(),
      isEnabled: this.config.isAgentEnabled(),
      usePersistentBuffer: config.usePersistentBuffer,
      maxRetries: config.maxRetries
    };
  }

  /**
     * Intenta enviar items fallidos del buffer persistente
     */
  async retryFailedItems() {
    await this.buffer.retryFailedItems(this.buffer.sendCallback);
  }

  /**
     * Desactiva el agent
     */
  disable() {
    this.config.configure({ endpoint: null }); // Deshabilitar
    this.queue.clear();
    this.retry.clear();
  }
}

// Instancia singleton
export const agent = new Agent(); 