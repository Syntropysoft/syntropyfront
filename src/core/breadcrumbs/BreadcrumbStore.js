/**
 * BreadcrumbStore - Almacén de huellas del usuario
 * Mantiene un historial de las últimas acciones del usuario
 */
export class BreadcrumbStore {
  constructor(maxBreadcrumbs = 25) {
    this.maxBreadcrumbs = maxBreadcrumbs;
    this.breadcrumbs = [];
    this.agent = null;
  }

  /**
     * Configura el agent para envío automático
     * @param {Object} agent - Instancia del agent
     */
  setAgent(agent) {
    this.agent = agent;
  }

  /**
     * Configura el tamaño máximo de breadcrumbs
     * @param {number} maxBreadcrumbs - Nuevo tamaño máximo
     */
  setMaxBreadcrumbs(maxBreadcrumbs) {
    this.maxBreadcrumbs = maxBreadcrumbs;
        
    // Si el nuevo tamaño es menor, eliminar breadcrumbs excedentes
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
     * Obtiene el tamaño máximo actual
     * @returns {number} Tamaño máximo de breadcrumbs
     */
  getMaxBreadcrumbs() {
    return this.maxBreadcrumbs;
  }

  /**
     * Añade un breadcrumb a la lista
     * @param {Object} crumb - El breadcrumb a añadir
     * @param {string} crumb.category - Categoría del evento (ui, network, error, etc.)
     * @param {string} crumb.message - Mensaje descriptivo
     * @param {Object} [crumb.data] - Datos adicionales opcionales
     */
  add(crumb) {
    const breadcrumb = {
      ...crumb,
      timestamp: new Date().toISOString(),
    };

    if (this.breadcrumbs.length >= this.maxBreadcrumbs) {
      this.breadcrumbs.shift(); // Elimina el más antiguo
    }
        
    this.breadcrumbs.push(breadcrumb);
        
    // Callback opcional para logging
    if (this.onBreadcrumbAdded) {
      this.onBreadcrumbAdded(breadcrumb);
    }
        
    // Enviar al agent si está configurado y habilitado
    if (this.agent && this.agent.isEnabled) {
      try {
        this.agent.sendBreadcrumbs([breadcrumb]);
      } catch (error) {
        console.warn('SyntropyFront: Error enviando breadcrumb al agent:', error);
      }
    }
  }

  /**
     * Devuelve todos los breadcrumbs
     * @returns {Array} Copia de todos los breadcrumbs
     */
  getAll() {
    return [...this.breadcrumbs];
  }

  /**
     * Limpia todos los breadcrumbs
     */
  clear() {
    this.breadcrumbs = [];
  }

  /**
     * Obtiene breadcrumbs por categoría
     * @param {string} category - Categoría a filtrar
     * @returns {Array} Breadcrumbs de la categoría especificada
     */
  getByCategory(category) {
    return this.breadcrumbs.filter(b => b.category === category);
  }
}

// Instancia singleton
export const breadcrumbStore = new BreadcrumbStore(); 