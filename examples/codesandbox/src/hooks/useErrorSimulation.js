/**
 * Hook para manejar error simulation
 * Responsabilidad única: Simular errores
 */
export const useErrorSimulation = (addBreadcrumb) => {
  const simulateError = () => {
    addBreadcrumb('error', 'About to simulate error');
    
    setTimeout(() => {
      const obj = null;
      console.log(obj.nonExistentProperty); // TypeError: Cannot read property 'nonExistentProperty' of null
    }, 100);
  };

  return {
    simulateError
  };
}; 