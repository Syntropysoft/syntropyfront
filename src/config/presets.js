/**
 * Presets de configuración para SyntropyFront
 * Recetas pre-configuradas para diferentes casos de uso
 * 
 * @author SyntropyFront Team
 * @version 1.0.0
 */

/**
 * Preset 'safe' - Modo solo emergencias
 * Ideal para: Producción, aplicaciones críticas, GDPR estricto
 */
export const SAFE_PRESET = {
    name: 'safe',
    description: 'Modo solo emergencias - Mínimo impacto, máxima privacidad',
    
    // Configuración del agent
    agent: {
        batchTimeout: null, // Solo errores
        batchSize: 5,
        encrypt: null // Sin encriptación por defecto
    },
    
    // Breadcrumbs limitados
    maxBreadcrumbs: 10,
    
    // Contexto mínimo
    context: {
        device: true,     // Solo información básica del dispositivo
        window: false,    // No URL ni viewport
        session: true,    // Solo sessionId
        ui: false,        // No información de UI
        network: false    // No información de red
    },
    
    // Sin tracking de objetos
    customObjects: {},
    proxyTracking: false,
    
    // Interceptores básicos
    captureClicks: false,
    captureFetch: false,
    captureErrors: true,
    captureUnhandledRejections: true,
    
    // Worker opcional
    useWorker: false,
    
    // Callbacks
    onError: null,
    onBreadcrumbAdded: null
};

/**
 * Preset 'balanced' - Modo equilibrado
 * Ideal para: Desarrollo, testing, aplicaciones generales
 */
export const BALANCED_PRESET = {
    name: 'balanced',
    description: 'Modo equilibrado - Balance entre información y performance',
    
    // Configuración del agent
    agent: {
        batchTimeout: 10000, // Envío cada 10 segundos
        batchSize: 20,
        encrypt: null
    },
    
    // Breadcrumbs moderados
    maxBreadcrumbs: 50,
    
    // Contexto curado
    context: {
        device: true,     // Información completa del dispositivo
        window: true,     // URL y viewport
        session: true,    // Información de sesión
        ui: true,         // Estado básico de UI
        network: true     // Estado de conectividad
    },
    
    // Tracking de objetos moderado
    customObjects: {},
    proxyTracking: {
        enabled: true,
        maxStates: 10,
        trackNested: true,
        trackArrays: false
    },
    
    // Interceptores completos
    captureClicks: true,
    captureFetch: true,
    captureErrors: true,
    captureUnhandledRejections: true,
    
    // Worker habilitado
    useWorker: true,
    
    // Callbacks
    onError: null,
    onBreadcrumbAdded: null
};

/**
 * Preset 'debug' - Modo debug completo
 * Ideal para: Desarrollo, debugging, análisis profundo
 */
export const DEBUG_PRESET = {
    name: 'debug',
    description: 'Modo debug completo - Máxima información para desarrollo',
    
    // Configuración del agent
    agent: {
        batchTimeout: 5000, // Envío cada 5 segundos
        batchSize: 50,
        encrypt: null
    },
    
    // Breadcrumbs completos
    maxBreadcrumbs: 100,
    
    // Contexto completo
    context: {
        device: true,     // Todo del dispositivo
        window: true,     // Todo de la ventana
        session: true,    // Todo de la sesión
        ui: true,         // Todo de la UI
        network: true     // Todo de la red
    },
    
    // Tracking de objetos completo
    customObjects: {},
    proxyTracking: {
        enabled: true,
        maxStates: 20,
        trackNested: true,
        trackArrays: true,
        trackFunctions: true
    },
    
    // Todos los interceptores
    captureClicks: true,
    captureFetch: true,
    captureErrors: true,
    captureUnhandledRejections: true,
    
    // Worker habilitado
    useWorker: true,
    
    // Callbacks para debugging
    onError: (error) => {
        console.error('SyntropyFront Error:', error);
    },
    onBreadcrumbAdded: (breadcrumb) => {
        console.log('SyntropyFront Breadcrumb:', breadcrumb);
    }
};

/**
 * Preset 'performance' - Modo optimizado para performance
 * Ideal para: Aplicaciones de alta performance, gaming, real-time
 */
export const PERFORMANCE_PRESET = {
    name: 'performance',
    description: 'Modo performance - Máxima velocidad, información mínima',
    
    // Configuración del agent
    agent: {
        batchTimeout: null, // Solo errores críticos
        batchSize: 3,
        encrypt: null
    },
    
    // Breadcrumbs mínimos
    maxBreadcrumbs: 5,
    
    // Contexto mínimo
    context: {
        device: false,    // Sin información de dispositivo
        window: false,    // Sin información de ventana
        session: true,    // Solo sessionId
        ui: false,        // Sin información de UI
        network: false    // Sin información de red
    },
    
    // Sin tracking de objetos
    customObjects: {},
    proxyTracking: false,
    
    // Solo errores críticos
    captureClicks: false,
    captureFetch: false,
    captureErrors: true,
    captureUnhandledRejections: true,
    
    // Sin worker para máxima velocidad
    useWorker: false,
    
    // Sin callbacks
    onError: null,
    onBreadcrumbAdded: null
};

/**
 * Mapa de presets disponibles
 */
export const PRESETS = {
    safe: SAFE_PRESET,
    balanced: BALANCED_PRESET,
    debug: DEBUG_PRESET,
    performance: PERFORMANCE_PRESET
};

/**
 * Obtiene un preset por nombre
 */
export function getPreset(name) {
    const preset = PRESETS[name];
    if (!preset) {
        throw new Error(`Preset '${name}' no encontrado. Presets disponibles: ${Object.keys(PRESETS).join(', ')}`);
    }
    return preset;
}

/**
 * Lista todos los presets disponibles
 */
export function getAvailablePresets() {
    return Object.keys(PRESETS).map(name => ({
        name,
        ...PRESETS[name]
    }));
}

/**
 * Valida si un preset existe
 */
export function isValidPreset(name) {
    return name in PRESETS;
}

/**
 * Obtiene información de un preset
 */
export function getPresetInfo(name) {
    const preset = getPreset(name);
    return {
        name: preset.name,
        description: preset.description,
        features: {
            breadcrumbs: preset.maxBreadcrumbs,
            context: Object.keys(preset.context).filter(key => preset.context[key]).length,
            worker: preset.useWorker,
            proxyTracking: preset.proxyTracking?.enabled || false,
            agentMode: preset.agent.batchTimeout ? 'completo' : 'solo emergencias'
        }
    };
} 