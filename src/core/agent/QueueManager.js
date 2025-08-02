/**
 * QueueManager - Maneja la cola de envío y batching
 * Responsabilidad única: Gestionar cola de items y batching
 */
export class QueueManager {
    constructor(configManager) {
        this.config = configManager;
        this.queue = [];
        this.batchTimer = null;
        this.flushCallback = null; // Callback interno para flush automático
    }

    /**
     * Añade un item a la cola
     * @param {Object} item - Item a añadir
     */
    add(item) {
        this.queue.push(item);

        // Enviar inmediatamente si alcanza el tamaño del batch
        if (this.queue.length >= this.config.batchSize) {
            this.flush(this.flushCallback);
        } else if (this.config.batchSize && this.config.batchTimeout && !this.batchTimer) {
            // Solo programar timeout si batchTimeout está configurado
            this.batchTimer = setTimeout(() => {
                this.flush(this.flushCallback);
            }, this.config.batchTimeout);
        }
    }

    /**
     * Obtiene todos los items de la cola
     */
    getAll() {
        return [...this.queue];
    }

    /**
     * Limpia la cola
     */
    clear() {
        this.queue = [];
        this.clearTimer();
    }

    /**
     * Limpia el timer
     */
    clearTimer() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }

    /**
     * Obtiene el tamaño de la cola
     */
    getSize() {
        return this.queue.length;
    }

    /**
     * Verifica si la cola está vacía
     */
    isEmpty() {
        return this.queue.length === 0;
    }

    /**
     * Flush de la cola (método que será llamado por el Agent)
     * @param {Function} flushCallback - Callback para procesar los items
     */
    async flush(flushCallback) {
        if (this.queue.length === 0) return;

        const itemsToSend = [...this.queue];
        this.queue = [];
        this.clearTimer();

        if (flushCallback) {
            await flushCallback(itemsToSend);
        }
    }
} 