import { robustSerializer } from '../../utils/RobustSerializer.js';

/**
 * RetryLogicManager - Maneja la lógica de reintentos y limpieza
 * Responsabilidad única: Gestionar reintentos y limpieza de items fallidos
 */
export class RetryLogicManager {
    constructor(storageManager, configManager) {
        this.storageManager = storageManager;
        this.config = configManager;
    }

    /**
     * Intenta enviar items fallidos del buffer persistente
     * @param {Function} sendCallback - Callback para enviar items
     * @param {Function} removeCallback - Callback para remover items exitosos
     */
    async retryFailedItems(sendCallback, removeCallback) {
        if (!this.storageManager) {
            console.warn('SyntropyFront: Storage manager no disponible');
            return;
        }

        try {
            const failedItems = await this.storageManager.retrieve();
            
            for (const item of failedItems) {
                if (item.retryCount < this.config.maxRetries) {
                    // Deserializar items del buffer
                    let deserializedItems;
                    try {
                        if (typeof item.items === 'string') {
                            deserializedItems = robustSerializer.deserialize(item.items);
                        } else {
                            deserializedItems = item.items;
                        }
                    } catch (error) {
                        console.error('SyntropyFront: Error deserializando items del buffer:', error);
                        await this.removeFailedItem(item.id);
                        continue;
                    }
                    
                    if (sendCallback) {
                        try {
                            await sendCallback(deserializedItems, item.retryCount + 1, item.id);
                            
                            // Si el envío fue exitoso, remover del buffer
                            if (removeCallback) {
                                await removeCallback(item.id);
                            } else {
                                await this.removeFailedItem(item.id);
                            }
                            
                            console.log(`SyntropyFront: Reintento exitoso para item ${item.id}`);
                        } catch (error) {
                            console.warn(`SyntropyFront: Reintento falló para item ${item.id}:`, error);
                            
                            // Incrementar contador de reintentos
                            await this.incrementRetryCount(item.id);
                        }
                    }
                } else {
                    console.warn(`SyntropyFront: Item ${item.id} excedió máximo de reintentos, removiendo del buffer`);
                    await this.removeFailedItem(item.id);
                }
            }
        } catch (error) {
            console.error('SyntropyFront: Error procesando reintentos:', error);
        }
    }

    /**
     * Incrementa el contador de reintentos de un item
     * @param {number} id - ID del item
     */
    async incrementRetryCount(id) {
        try {
            const currentItem = await this.storageManager.retrieveById(id);
            if (currentItem) {
                await this.storageManager.update(id, {
                    retryCount: currentItem.retryCount + 1
                });
            }
        } catch (error) {
            console.error('SyntropyFront: Error incrementando contador de reintentos:', error);
        }
    }

    /**
     * Remueve un item fallido del buffer
     * @param {number} id - ID del item
     */
    async removeFailedItem(id) {
        try {
            await this.storageManager.remove(id);
        } catch (error) {
            console.error('SyntropyFront: Error removiendo item fallido:', error);
        }
    }

    /**
     * Limpia items que han excedido el máximo de reintentos
     */
    async cleanupExpiredItems() {
        try {
            const allItems = await this.storageManager.retrieve();
            const expiredItems = allItems.filter(item => item.retryCount >= this.config.maxRetries);
            
            for (const item of expiredItems) {
                await this.removeFailedItem(item.id);
                console.warn(`SyntropyFront: Item ${item.id} removido por exceder máximo de reintentos`);
            }
            
            if (expiredItems.length > 0) {
                console.log(`SyntropyFront: Limpieza completada, ${expiredItems.length} items removidos`);
            }
        } catch (error) {
            console.error('SyntropyFront: Error en limpieza de items expirados:', error);
        }
    }

    /**
     * Obtiene estadísticas de reintentos
     */
    async getRetryStats() {
        try {
            const allItems = await this.storageManager.retrieve();
            
            const stats = {
                totalItems: allItems.length,
                itemsByRetryCount: {},
                averageRetryCount: 0
            };

            if (allItems.length > 0) {
                const totalRetries = allItems.reduce((sum, item) => sum + item.retryCount, 0);
                stats.averageRetryCount = totalRetries / allItems.length;
                
                allItems.forEach(item => {
                    const retryCount = item.retryCount;
                    stats.itemsByRetryCount[retryCount] = (stats.itemsByRetryCount[retryCount] || 0) + 1;
                });
            }

            return stats;
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo estadísticas de reintentos:', error);
            return {
                totalItems: 0,
                itemsByRetryCount: {},
                averageRetryCount: 0
            };
        }
    }
} 