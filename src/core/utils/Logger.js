/**
 * Logger - Hace logging solo en errores
 * Single responsibility: Show messages only when there are errors
 */
export class Logger {
  constructor() {
    this.isSilent = true; // Por defecto silente
  }

  log(message, data = null) {
    // No loggear nada en modo silente
    if (this.isSilent) return;
        
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }

  error(message, data = null) {
    // SIEMPRE loggear errores (ignora modo silencioso)
    if (data) {
      console.error(message, data);
    } else {
      console.error(message);
    }
  }

  warn(message, data = null) {
    // Solo warnings importantes
    if (data) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  }

  // Enable logging (debug only)
  enableLogging() {
    this.isSilent = false;
  }

  // Disable logging
  disableLogging() {
    this.isSilent = true;
  }
} 