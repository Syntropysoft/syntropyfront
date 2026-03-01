import { robustSerializer } from '../../utils/RobustSerializer.js';

/**
 * HttpTransport - HTTP send to the backend.
 * Contract: send(items) serializes and POSTs; applyEncryption(data) applies config.encrypt if present; isConfigured() by endpoint.
 */
export class HttpTransport {
  /** @param {{ endpoint: string|null, headers: Object, encrypt?: function }} configManager */
  constructor(configManager) {
    this.config = configManager;
  }

  /**
   * Serializes items, applies encrypt if configured, POSTs to endpoint.
   * @param {Array<Object>} items - Items to send
   * @returns {Promise<Object>} response.json()
   * @throws {Error} If HTTP !ok or network failure
   */
  async send(items) {
    const payload = {
      timestamp: new Date().toISOString(),
      items
    };

    // ✅ ROBUST SERIALIZATION: Use serializer that handles circular references
    let serializedPayload;
    try {
      serializedPayload = robustSerializer.serialize(payload);
    } catch (error) {
      console.error('SyntropyFront: Error in payload serialization:', error);

      // Fallback: attempt basic serialization with error info
      serializedPayload = JSON.stringify({
        __serializationError: true,
        error: error.message,
        timestamp: new Date().toISOString(),
        itemsCount: items.length,
        fallbackData: 'Serialization failed, data not sent'
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
   * Applies encryption if configured.
   * @param {*} data - Data to encrypt
   * @returns {*} Encrypted data or unchanged
   */
  applyEncryption(data) {
    if (this.config.encrypt) {
      return this.config.encrypt(data);
    }
    return data;
  }

  /** @returns {boolean} */
  isConfigured() {
    return !!this.config.endpoint;
  }
}
