/**
 * ErrorManager - Gestiona errores
 * Responsabilidad única: Formatear y gestionar errores
 */
export class ErrorManager {
  constructor() {
    this.errors = [];
  }

  send(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };
        
    this.errors.push(errorData);
    return errorData;
  }

  getAll() {
    return this.errors;
  }

  clear() {
    this.errors = [];
  }

  getCount() {
    return this.errors.length;
  }
} 