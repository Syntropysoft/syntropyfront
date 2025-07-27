// USO SÚPER SIMPLE - SOLO 2 LÍNEAS

// 1. Importar la librería (se auto-inicializa)
import syntropyFront from './syntropyfront.js';

// 2. Usar cuando la app esté lista
const isReady = useAppReady();
if (isReady) {
    // ¡Listo! Ya puedes usar la librería
    syntropyFront.addBreadcrumb('user', 'App loaded');
    syntropyFront.sendError(new Error('Test error'));
}

// ESO ES TODO. No más configuración, no más setup complejo. 