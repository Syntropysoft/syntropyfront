/**
 * BreadcrumbStore - User action timeline storage
 * Maintains a history of the last user actions.
 * Does not know about Agent or sending; the orchestrator wires onBreadcrumbAdded to decide what to do.
 */
export class BreadcrumbStore {
  constructor(maxBreadcrumbs = 25) {
    this.maxBreadcrumbs = maxBreadcrumbs;
    this.breadcrumbs = [];
    /** @type {((crumb: object) => void)|null} Optional callback when a breadcrumb is added (set by orchestrator). */
    this.onBreadcrumbAdded = null;
  }

  /**
     * Configures the maximum breadcrumb size
     * @param {number} maxBreadcrumbs - New maximum size
     */
  setMaxBreadcrumbs(maxBreadcrumbs) {
    this.maxBreadcrumbs = maxBreadcrumbs;

    // If new size is smaller, remove excess breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
     * Gets current maximum size
     * @returns {number} Maximum breadcrumb size
     */
  getMaxBreadcrumbs() {
    return this.maxBreadcrumbs;
  }

  /**
     * Adds a breadcrumb to the list
     * @param {Object} crumb - The breadcrumb to add
     * @param {string} crumb.category - Event category (ui, network, error, etc.)
     * @param {string} crumb.message - Descriptive message
     * @param {Object} [crumb.data] - Optional additional data
     */
  add(crumb) {
    const breadcrumb = {
      ...crumb,
      timestamp: new Date().toISOString(),
    };

    // Functional limit management
    this.breadcrumbs = [...this.breadcrumbs, breadcrumb].slice(-this.maxBreadcrumbs);

    if (this.onBreadcrumbAdded) {
      try {
        this.onBreadcrumbAdded(breadcrumb);
      } catch (error) {
        console.warn('SyntropyFront: Error in onBreadcrumbAdded:', error);
      }
    }
  }

  /**
     * Returns all breadcrumbs
     * @returns {Array} List of all breadcrumbs
     */
  getAll() {
    return [...this.breadcrumbs];
  }

  /**
     * Clears all breadcrumbs
     */
  clear() {
    this.breadcrumbs = [];
  }

  /**
     * Gets current breadcrumb count
     * @returns {number} Breadcrumb count
     */
  count() {
    return this.breadcrumbs.length;
  }

  /**
     * Gets breadcrumbs by category
     * @param {string} category - Category to filter
     * @returns {Array} Breadcrumbs of the specified category
     */
  getByCategory(category) {
    return this.breadcrumbs.filter(b => b.category === category);
  }
}

// Singleton instance
export const breadcrumbStore = new BreadcrumbStore();