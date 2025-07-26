/**
 * CustomObjectCollector - Recolector de objetos personalizados
 * Permite al usuario agregar objetos específicos que quiere trackear
 */
export class CustomObjectCollector {
    constructor() {
        this.customObjects = new Map();
        this.objectStates = new Map(); // Historial de estados
    }

    /**
     * Agrega un objeto personalizado para trackear
     * @param {string} name - Nombre del objeto
     * @param {string} source - Ruta donde encontrarlo (ej: "window.myObject")
     * @param {number} maxStates - Máximo número de estados a guardar
     */
    addCustomObject(name, source, maxStates = 10) {
        this.customObjects.set(name, {
            source: source,
            maxStates: maxStates,
            enabled: true
        });

        // Inicializar el historial de estados
        this.objectStates.set(name, []);
        
        console.log(`SyntropyFront: Objeto personalizado agregado: ${name} -> ${source}`);
    }

    /**
     * Remueve un objeto personalizado
     * @param {string} name - Nombre del objeto
     */
    removeCustomObject(name) {
        this.customObjects.delete(name);
        this.objectStates.delete(name);
        console.log(`SyntropyFront: Objeto personalizado removido: ${name}`);
    }

    /**
     * Obtiene el valor actual de un objeto personalizado
     * @param {string} name - Nombre del objeto
     * @returns {any} Valor del objeto o null si no existe
     */
    getObjectValue(name) {
        const config = this.customObjects.get(name);
        if (!config || !config.enabled) {
            return null;
        }

        try {
            // Evaluar la ruta del objeto (ej: "window.myObject")
            const value = this.evaluatePath(config.source);
            
            // Guardar el estado en el historial
            this.saveObjectState(name, value);
            
            return value;
        } catch (error) {
            console.warn(`SyntropyFront: Error obteniendo objeto ${name}:`, error);
            return null;
        }
    }

    /**
     * Evalúa una ruta de objeto (ej: "window.myObject")
     * @param {string} path - Ruta del objeto
     * @returns {any} Valor del objeto
     */
    evaluatePath(path) {
        // Dividir la ruta por puntos
        const parts = path.split('.');
        let current = window;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                throw new Error(`Path not found: ${path}`);
            }
        }

        return current;
    }

    /**
     * Guarda el estado actual del objeto en el historial
     * @param {string} name - Nombre del objeto
     * @param {any} value - Valor actual
     */
    saveObjectState(name, value) {
        const config = this.customObjects.get(name);
        if (!config) return;

        const states = this.objectStates.get(name) || [];
        const stateEntry = {
            timestamp: new Date().toISOString(),
            value: value
        };

        states.push(stateEntry);

        // Mantener solo los últimos N estados
        if (states.length > config.maxStates) {
            states.shift(); // Remover el más antiguo
        }

        this.objectStates.set(name, states);
    }

    /**
     * Obtiene el historial de estados de un objeto
     * @param {string} name - Nombre del objeto
     * @returns {Array} Historial de estados
     */
    getObjectHistory(name) {
        return this.objectStates.get(name) || [];
    }

    /**
     * Recolecta todos los objetos personalizados
     * @returns {Object} Objetos personalizados con sus valores actuales
     */
    collectCustomObjects() {
        const result = {};

        for (const [name, config] of this.customObjects) {
            if (config.enabled) {
                const value = this.getObjectValue(name);
                if (value !== null) {
                    result[name] = {
                        current: value,
                        history: this.getObjectHistory(name)
                    };
                }
            }
        }

        return result;
    }

    /**
     * Obtiene la lista de objetos personalizados configurados
     * @returns {Array} Lista de nombres de objetos
     */
    getCustomObjectNames() {
        return Array.from(this.customObjects.keys());
    }

    /**
     * Habilita/deshabilita un objeto personalizado
     * @param {string} name - Nombre del objeto
     * @param {boolean} enabled - Si está habilitado
     */
    setObjectEnabled(name, enabled) {
        const config = this.customObjects.get(name);
        if (config) {
            config.enabled = enabled;
        }
    }

    /**
     * Limpia todos los objetos personalizados
     */
    clear() {
        this.customObjects.clear();
        this.objectStates.clear();
    }
}

// Instancia singleton
export const customObjectCollector = new CustomObjectCollector(); 