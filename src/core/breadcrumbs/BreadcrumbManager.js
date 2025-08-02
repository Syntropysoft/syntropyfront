/**
 * BreadcrumbManager - Gestiona breadcrumbs
 * Responsabilidad única: Almacenar y gestionar breadcrumbs
 */
export class BreadcrumbManager {
  constructor() {
    this.breadcrumbs = [];
  }

  add(category, message, data = {}) {
    const breadcrumb = {
      category,
      message,
      data,
      timestamp: new Date().toISOString()
    };
        
    this.breadcrumbs.push(breadcrumb);
    return breadcrumb;
  }

  getAll() {
    return this.breadcrumbs;
  }

  clear() {
    this.breadcrumbs = [];
  }

  getCount() {
    return this.breadcrumbs.length;
  }
} 