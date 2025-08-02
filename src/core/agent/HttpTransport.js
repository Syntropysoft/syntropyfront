import { robustSerializer } from '../../utils/RobustSerializer.js';

/**
 * HttpTransport - Maneja el envío HTTP
 * Responsabilidad única: Gestionar envío HTTP y serialización
 */
export class HttpTransport {
    constructor(configManager) {
        this.config = configManager;
    }

    /**
     * Envía datos al backend
     * @param {Array} items - Items a enviar
     */
    async send(items) {
        const payload = {
            timestamp: new Date().toISOString(),
            items
        };

        // ✅ SERIALIZACIÓN ROBUSTA: Usar serializador que maneja referencias circulares
        let serializedPayload;
        try {
            serializedPayload = robustSerializer.serialize(payload);
        } catch (error) {
            console.error('SyntropyFront: Error en serialización del payload:', error);
            
            // Fallback: intentar serialización básica con información de error
            serializedPayload = JSON.stringify({
                __serializationError: true,
                error: error.message,
                timestamp: new Date().toISOString(),
                itemsCount: items.length,
                fallbackData: 'Serialización falló, datos no enviados'
            });
        }

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: this.config.headers,
            body: serializedPayload
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Aplica encriptación si está configurada
     * @param {*} data - Datos a encriptar
     */
    applyEncryption(data) {
        if (this.config.encrypt) {
            return this.config.encrypt(data);
        }
        return data;
    }

    /**
     * Verifica si el transport está configurado
     */
    isConfigured() {
        return !!this.config.endpoint;
    }
} 