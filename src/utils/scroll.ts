export const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    
    if (element) {
      // 1. Detectamos el ancho de la pantalla
      // Usamos 768px como punto de quiebre (igual que 'md' en Tailwind)
      const isMobile = window.innerWidth < 768;
  
      // 2. Definimos cuánto espacio dejar arriba
      // Desktop: 80px (ajusta esto al tamaño de tu header)
      // Móvil: 120px (o más, para que el contenido baje más y no se corte)
      const offset = isMobile ? 400 : 80; 
  
      // 3. Calculamos la posición exacta
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      
      // 4. Restamos el offset para "bajar" la vista
      const offsetPosition = elementPosition - offset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };