/**
 * ContextCollector - Recolector dinámico de contexto
 * Sistema elegante para recolectar datos según lo que pida el usuario
 * Por defecto: Sets curados y seguros
 * Configuración específica: El usuario elige exactamente qué quiere
 */
export class ContextCollector {
    constructor() {
        // Sets curados por defecto (seguros y útiles)
        this.defaultContexts = {
            device: {
                userAgent: () => navigator.userAgent,
                language: () => navigator.language,
                screen: () => ({
                    width: window.screen.width,
                    height: window.screen.height
                }),
                timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            window: {
                url: () => window.location.href,
                viewport: () => ({
                    width: window.innerWidth,
                    height: window.innerHeight
                }),
                title: () => document.title
            },
            session: {
                sessionId: () => this.generateSessionId(),
                pageLoadTime: () => performance.now()
            },
            ui: {
                visibility: () => document.visibilityState,
                activeElement: () => document.activeElement ? {
                    tagName: document.activeElement.tagName
                } : null
            },
            network: {
                online: () => navigator.onLine,
                connection: () => navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType
                } : null
            }
        };

        // Mapeo completo de todos los campos disponibles
        this.allFields = {
            device: {
                userAgent: () => navigator.userAgent,
                language: () => navigator.language,
                languages: () => navigator.languages,
                screen: () => ({
                    width: window.screen.width,
                    height: window.screen.height,
                    availWidth: window.screen.availWidth,
                    availHeight: window.screen.availHeight,
                    colorDepth: window.screen.colorDepth,
                    pixelDepth: window.screen.pixelDepth
                }),
                timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
                cookieEnabled: () => navigator.cookieEnabled,
                doNotTrack: () => navigator.doNotTrack
            },
            window: {
                url: () => window.location.href,
                pathname: () => window.location.pathname,
                search: () => window.location.search,
                hash: () => window.location.hash,
                referrer: () => document.referrer,
                title: () => document.title,
                viewport: () => ({
                    width: window.innerWidth,
                    height: window.innerHeight
                })
            },
            storage: {
                localStorage: () => {
                    const keys = Object.keys(localStorage);
                    return {
                        keys: keys.length,
                        size: JSON.stringify(localStorage).length,
                        keyNames: keys // Solo nombres, no valores
                    };
                },
                sessionStorage: () => {
                    const keys = Object.keys(sessionStorage);
                    return {
                        keys: keys.length,
                        size: JSON.stringify(sessionStorage).length,
                        keyNames: keys // Solo nombres, no valores
                    };
                }
            },
            network: {
                online: () => navigator.onLine,
                connection: () => navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                } : null
            },
            ui: {
                focused: () => document.hasFocus(),
                visibility: () => document.visibilityState,
                activeElement: () => document.activeElement ? {
                    tagName: document.activeElement.tagName,
                    id: document.activeElement.id,
                    className: document.activeElement.className
                } : null
            },
            performance: {
                memory: () => window.performance && window.performance.memory ? {
                    used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(window.performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)
                } : null,
                timing: () => window.performance ? {
                    navigationStart: window.performance.timing.navigationStart,
                    loadEventEnd: window.performance.timing.loadEventEnd
                } : null
            },
            session: {
                sessionId: () => this.generateSessionId(),
                startTime: () => new Date().toISOString(),
                pageLoadTime: () => performance.now()
            }
        };
    }

    /**
     * Recolecta contexto según la configuración
     * @param {Object} contextConfig - Configuración de contexto
     * @returns {Object} Contexto recolectado
     */
    collect(contextConfig = {}) {
        const context = {};

        Object.entries(contextConfig).forEach(([contextType, config]) => {
            try {
                if (config === true) {
                    // Usar set curado por defecto
                    context[contextType] = this.collectDefaultContext(contextType);
                } else if (Array.isArray(config)) {
                    // Configuración específica: array de campos
                    context[contextType] = this.collectSpecificFields(contextType, config);
                } else if (config === false) {
                    // Explícitamente deshabilitado
                    // No hacer nada
                } else {
                    console.warn(`SyntropyFront: Configuración de contexto inválida para ${contextType}:`, config);
                }
            } catch (error) {
                console.warn(`SyntropyFront: Error recolectando contexto ${contextType}:`, error);
                context[contextType] = { error: 'Failed to collect' };
            }
        });

        return context;
    }

    /**
     * Recolecta el set curado por defecto
     * @param {string} contextType - Tipo de contexto
     * @returns {Object} Contexto por defecto
     */
    collectDefaultContext(contextType) {
        const defaultContext = this.defaultContexts[contextType];
        if (!defaultContext) {
            console.warn(`SyntropyFront: No hay set por defecto para ${contextType}`);
            return {};
        }

        const result = {};
        Object.entries(defaultContext).forEach(([field, getter]) => {
            try {
                result[field] = getter();
            } catch (error) {
                console.warn(`SyntropyFront: Error recolectando campo ${field} de ${contextType}:`, error);
                result[field] = null;
            }
        });

        return result;
    }

    /**
     * Recolecta campos específicos
     * @param {string} contextType - Tipo de contexto
     * @param {Array} fields - Campos específicos a recolectar
     * @returns {Object} Contexto específico
     */
    collectSpecificFields(contextType, fields) {
        const allFields = this.allFields[contextType];
        if (!allFields) {
            console.warn(`SyntropyFront: Tipo de contexto desconocido: ${contextType}`);
            return {};
        }

        const result = {};
        fields.forEach(field => {
            try {
                if (allFields[field]) {
                    result[field] = allFields[field]();
                } else {
                    console.warn(`SyntropyFront: Campo ${field} no disponible en ${contextType}`);
                }
            } catch (error) {
                console.warn(`SyntropyFront: Error recolectando campo ${field} de ${contextType}:`, error);
                result[field] = null;
            }
        });

        return result;
    }

    /**
     * Genera un ID de sesión simple
     */
    generateSessionId() {
        if (!this._sessionId) {
            this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this._sessionId;
    }

    /**
     * Obtiene la lista de tipos de contexto disponibles
     * @returns {Array} Tipos disponibles
     */
    getAvailableTypes() {
        return Object.keys(this.allFields);
    }

    /**
     * Obtiene la lista de campos disponibles para un tipo de contexto
     * @param {string} contextType - Tipo de contexto
     * @returns {Array} Campos disponibles
     */
    getAvailableFields(contextType) {
        const fields = this.allFields[contextType];
        return fields ? Object.keys(fields) : [];
    }

    /**
     * Obtiene información sobre los sets por defecto
     * @returns {Object} Información de sets por defecto
     */
    getDefaultContextsInfo() {
        const info = {};
        Object.entries(this.defaultContexts).forEach(([type, fields]) => {
            info[type] = Object.keys(fields);
        });
        return info;
    }
}

// Instancia singleton
export const contextCollector = new ContextCollector(); 