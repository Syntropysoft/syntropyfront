/**
 * ErrorManager - Manages errors
 * Single responsibility: Format and manage errors
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