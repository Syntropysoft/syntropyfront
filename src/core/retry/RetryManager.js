/**
 * RetryManager - Maneja el sistema de reintentos
 * Responsabilidad única: Gestionar reintentos con backoff exponencial
 */
export class RetryManager {
  constructor(configManager) {
    this.config = configManager;
    this.retryQueue = [];
    this.retryTimer = null;
  }

  /**
     * Añade items a la cola de reintentos
     * @param {Array} items - Items a reintentar
     * @param {number} retryCount - Número de reintento
     * @param {number} persistentId - ID en buffer persistente (opcional)
     */
  addToRetryQueue(items, retryCount = 1, persistentId = null) {
    const delay = Math.min(this.config.baseDelay * Math.pow(2, retryCount - 1), this.config.maxDelay);
        
    this.retryQueue.push({
      items,
      retryCount,
      persistentId,
      nextRetry: Date.now() + delay
    });

    this.scheduleRetry();
  }

  /**
     * Programa el próximo reintento
     */
  scheduleRetry() {
    if (this.retryTimer) return;

    const nextItem = this.retryQueue.find(item => item.nextRetry <= Date.now());
    if (!nextItem) return;

    this.retryTimer = setTimeout(() => {
      this.processRetryQueue();
    }, Math.max(0, nextItem.nextRetry - Date.now()));
  }

  /**
     * Procesa la cola de reintentos
     * @param {Function} sendCallback - Callback para enviar items
     * @param {Function} removePersistentCallback - Callback para remover del buffer persistente
     */
  async processRetryQueue(sendCallback, removePersistentCallback) {
    this.retryTimer = null;

    const now = Date.now();
    const itemsToRetry = this.retryQueue.filter(item => item.nextRetry <= now);
        
    for (const item of itemsToRetry) {
      try {
        if (sendCallback) {
          await sendCallback(item.items);
        }
                
        // ✅ Éxito: remover de cola de reintentos
        this.retryQueue = this.retryQueue.filter(q => q !== item);
                
        // Remover del buffer persistente si existe
        if (item.persistentId && removePersistentCallback) {
          await removePersistentCallback(item.persistentId);
        }
                
        console.log(`SyntropyFront: Reintento exitoso después de ${item.retryCount} intentos`);
      } catch (error) {
        console.warn(`SyntropyFront: Reintento ${item.retryCount} falló:`, error);
                
        if (item.retryCount >= this.config.maxRetries) {
          // ❌ Máximo de reintentos alcanzado
          this.retryQueue = this.retryQueue.filter(q => q !== item);
          console.error('SyntropyFront: Item excedió máximo de reintentos, datos perdidos');
        } else {
          // Programar próximo reintento
          item.retryCount++;
          item.nextRetry = Date.now() + Math.min(
            this.config.baseDelay * Math.pow(2, item.retryCount - 1), 
            this.config.maxDelay
          );
        }
      }
    }

    // Programar próximo reintento si quedan items
    if (this.retryQueue.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
     * Limpia la cola de reintentos
     */
  clear() {
    this.retryQueue = [];
    this.clearTimer();
  }

  /**
     * Limpia el timer
     */
  clearTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
     * Obtiene el tamaño de la cola de reintentos
     */
  getSize() {
    return this.retryQueue.length;
  }

  /**
     * Verifica si la cola de reintentos está vacía
     */
  isEmpty() {
    return this.retryQueue.length === 0;
  }
} 