/**
 * Logger - Hace logging
 * Responsabilidad única: Mostrar mensajes en consola
 */
export class Logger {
    log(message, data = null) {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }

    error(message, data = null) {
        if (data) {
            console.error(message, data);
        } else {
            console.error(message);
        }
    }

    warn(message, data = null) {
        if (data) {
            console.warn(message, data);
        } else {
            console.warn(message);
        }
    }
} 