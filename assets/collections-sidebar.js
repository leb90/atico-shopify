class CollectionsSidebar extends HTMLElement {
  constructor() {
    super();
    
    this.toggleButton = this.querySelector('#collections-sidebar-toggle');
    this.mobileToggleButton = document.querySelector('#header-collections-mobile-toggle');
    this.container = this.querySelector('#collections-sidebar-container');
    this.closeButton = this.querySelector('#collections-sidebar-close');
    this.overlay = this.querySelector('#collections-sidebar-overlay');
    this.drawer = this.querySelector('.collections-sidebar__drawer');
    
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    console.log('🎯 Inicializando Collections Sidebar...', {
      toggleButton: !!this.toggleButton,
      mobileToggleButton: !!this.mobileToggleButton,
      container: !!this.container,
      isMobile: window.innerWidth <= 749
    });
    
    if (!this.container) {
      console.error('❌ Container no encontrado para Collections Sidebar');
      return;
    }
    
    // En móvil, no necesitamos el botón desktop
    if (window.innerWidth <= 749 && !this.mobileToggleButton) {
      console.error('❌ Botón móvil no encontrado');
      return;
    }
    
    if (window.innerWidth > 749 && !this.toggleButton) {
      console.error('❌ Botón desktop no encontrado');
      return;
    }
    
    // Gestionar visibilidad del botón según el dispositivo
    const toggleButtonElement = this.querySelector('.collections-sidebar__toggle-button');
    if (toggleButtonElement) {
      if (window.innerWidth > 749) {
        // Desktop: mostrar botón
        toggleButtonElement.style.cssText = `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: fixed !important;
          left: 0 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 50 !important;
          flex-direction: column !important;
          align-items: center !important;
        `;
        console.log('✅ Botón desktop mostrado');
      } else {
        // Móvil: OCULTAR COMPLETAMENTE Y PARA SIEMPRE
        toggleButtonElement.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          left: -9999px !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          transform: translateX(-9999px) !important;
          position: absolute !important;
        `;
        toggleButtonElement.remove(); // Eliminar del DOM en móvil
        console.log('✅ Botón desktop ELIMINADO en móvil');
      }
    }
    
    // Event listeners para abrir/cerrar
    this.toggleButton?.addEventListener('click', this.open.bind(this));
    this.mobileToggleButton?.addEventListener('click', this.open.bind(this));
    this.closeButton?.addEventListener('click', this.close.bind(this));
    this.overlay?.addEventListener('click', this.close.bind(this));
    
    // Event listener para tecla ESC
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Prevenir scroll del body cuando la sidebar está abierta
    this.preventBodyScroll = this.preventBodyScroll.bind(this);
    
    // Event listeners para navegación por teclado
    this.setupKeyboardNavigation();
    
    // Prevent scroll cuando se abre la sidebar
    this.container.addEventListener('transitionend', (e) => {
      if (e.target === this.container && this.isOpen) {
        this.trapFocus();
      }
    });
    
    // Listener para cambio de tamaño de ventana
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('🎯 Collections Sidebar inicializada correctamente');
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.container.classList.add('is-open');
    document.body.classList.add('collections-sidebar-open');
    
    // Ocultar botón desktop manualmente
    if (this.toggleButton) {
      this.toggleButton.style.cssText = `
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translateY(-50%) translateX(-100%) !important;
      `;
    }
    
    // Prevent body scroll
    this.preventBodyScroll(true);
    
    // Focus en el primer elemento focuseable
    setTimeout(() => {
      this.trapFocus();
      this.closeButton?.focus();
    }, 300);
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReaders('Sidebar de categorías abierta');
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.container.classList.remove('is-open');
    document.body.classList.remove('collections-sidebar-open');
    
    // Restaurar botón desktop (solo si no es móvil)
    if (this.toggleButton && window.innerWidth > 749) {
      this.toggleButton.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        left: 0 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 50 !important;
        flex-direction: column !important;
        align-items: center !important;
        pointer-events: auto !important;
      `;
    }
    
    // Restore body scroll
    this.preventBodyScroll(false);
    
    // Return focus to toggle button
    if (window.innerWidth > 749) {
      this.toggleButton?.focus();
    } else {
      this.mobileToggleButton?.focus();
    }
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReaders('Sidebar de categorías cerrada');
  }
  
  handleKeyDown(event) {
    // Cerrar con ESC
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
      return;
    }
    
    // Trap focus dentro de la sidebar cuando está abierta
    if (this.isOpen && event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }
  
  handleTabKey(event) {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  getFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return this.drawer.querySelectorAll(focusableSelectors.join(', '));
  }
  
  trapFocus() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
  
  setupKeyboardNavigation() {
    const links = this.querySelectorAll('.collections-sidebar__link');
    
    links.forEach((link, index) => {
      link.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextLink = links[index + 1] || links[0];
          nextLink.focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevLink = links[index - 1] || links[links.length - 1];
          prevLink.focus();
        }
      });
    });
  }
  
  preventBodyScroll(prevent) {
    if (prevent) {
      // Store current scroll position
      this.scrollPosition = window.pageYOffset;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      window.scrollTo(0, this.scrollPosition || 0);
    }
  }
  
  announceForScreenReaders(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'collections-sidebar__visually-hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  handleResize() {
    const toggleButtonElement = this.querySelector('.collections-sidebar__toggle-button');
    if (!toggleButtonElement) return;
    
    if (window.innerWidth > 749) {
      // Desktop: mostrar botón (solo si la sidebar no está abierta)
      if (!this.isOpen) {
        toggleButtonElement.style.cssText = `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: fixed !important;
          left: 0 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 50 !important;
          flex-direction: column !important;
          align-items: center !important;
        `;
      }
    } else {
      // Móvil: ELIMINAR BOTÓN DESKTOP PARA SIEMPRE
      toggleButtonElement.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        left: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        transform: translateX(-9999px) !important;
      `;
      // Intentar eliminar del DOM si es posible
      try {
        toggleButtonElement.remove();
      } catch(e) {
        // Si no se puede eliminar, al menos ocultarlo completamente
      }
    }
  }

  // Método para abrir desde código externo si es necesario
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Registrar el custom element
customElements.define('collections-sidebar', CollectionsSidebar);

// Los estilos se han movido al archivo CSS principal

// Exportar para uso en otros archivos si es necesario
window.CollectionsSidebar = CollectionsSidebar;

// Función para reorganizar elementos en móvil
function reorganizeMobileLayout() {
  const isMobile = window.innerWidth <= 749;
  
  // Limpiar contenedor móvil si estamos en desktop
  if (!isMobile) {
    const leftContainer = document.querySelector('.header__left-mobile');
    const categoriesButton = document.querySelector('#header-collections-mobile-toggle');
    const headerIcons = document.querySelector('.header__icons');
    
    if (leftContainer) {
      // Limpiar todos los estilos inline para que CSS controle la visibilidad
      leftContainer.style.cssText = '';
      leftContainer.style.display = 'none';
      console.log('💻 Desktop detectado - ocultando contenedor móvil');
    }
    
    // Mover botón de categorías de vuelta a headerIcons si es necesario
    if (categoriesButton && headerIcons && !headerIcons.contains(categoriesButton)) {
      headerIcons.appendChild(categoriesButton);
      console.log('💻 Botón de categorías movido de vuelta a headerIcons');
    }
    
    // Limpiar estilos inline del headerIcons para desktop
    if (headerIcons) {
      headerIcons.style.cssText = '';
      console.log('💻 Estilos de headerIcons limpiados para desktop');
    }
    
    return; // Salir de la función en desktop
  }
  
  if (isMobile) {
    console.log('📱 Reorganizando layout para móvil...');
    
    // Elementos a mover
    const searchModal = document.querySelector('.header__search');
    const categoriesButton = document.querySelector('#header-collections-mobile-toggle');
    const headerIcons = document.querySelector('.header__icons');
    const header = document.querySelector('.header');
    
        if (categoriesButton && headerIcons && header) {
      console.log('🔍 Elementos encontrados:', {
        categoriesButton: !!categoriesButton,
        headerIcons: !!headerIcons,
        header: !!header
      });
      
      // Verificar y forzar visibilidad del botón de búsqueda
      const searchModal = document.querySelector('.header__search');
      if (searchModal) {
        searchModal.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        console.log('✅ Forzando visibilidad del botón de búsqueda');
      } else {
        console.error('❌ No se encontró el botón de búsqueda');
      }
      
      // 1. Mover SOLO el botón de categorías A LA IZQUIERDA del header
      // Crear contenedor para el botón a la izquierda
      let leftContainer = document.querySelector('.header__left-mobile');
      if (!leftContainer) {
        leftContainer = document.createElement('div');
        leftContainer.className = 'header__left-mobile';
        leftContainer.style.cssText = `
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
        `;
        header.appendChild(leftContainer);
        console.log('✅ Contenedor izquierdo creado');
      }
      
      // Solo mover si no está ya en el contenedor izquierdo
      if (!leftContainer.contains(categoriesButton)) {
        leftContainer.appendChild(categoriesButton);
        console.log('✅ Botón de categorías movido a la izquierda');
      } else {
        console.log('ℹ️ Botón de categorías ya está a la izquierda');
      }
      
      // 2. SOLO ajustar posición del contenedor de iconos (sin tocar su contenido)
      headerIcons.style.cssText = `
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        position: absolute !important;
        right: 1rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 3 !important;
      `;
      
      console.log('🎯 Layout móvil reorganizado - categorías a la izquierda, iconos intactos');
      } else {
        console.error('❌ No se encontraron elementos necesarios para reorganizar:', {
          categoriesButton: !!categoriesButton,
          headerIcons: !!headerIcons,
          header: !!header
        });
      }
  } else {
    console.log('💻 Modo desktop - no reorganizar');
  }
}

// Verificar que el componente se cargue correctamente
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM cargado, verificando Collections Sidebar...');
  
  // Reorganizar layout móvil
  reorganizeMobileLayout();
  
  // También verificar en resize
  window.addEventListener('resize', reorganizeMobileLayout);
  
  // FORZAR tamaño de fuente del título con JavaScript
  function forceHeaderTitleSize() {
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
      const isMobile = window.innerWidth <= 749;
      const isDesktop = window.innerWidth >= 990;
      
      let fontSize = '3rem'; // Tamaño base
      if (isDesktop) {
        fontSize = '3.5rem'; // Desktop más grande
      } else if (isMobile) {
        fontSize = '2.2rem'; // Móvil más pequeño
      }
      
      headerTitle.style.cssText = `
        font-size: ${fontSize} !important;
        font-weight: 700 !important;
        line-height: 1.1 !important;
      `;
      
      console.log(`✅ Título forzado a tamaño: ${fontSize}`);
    }
  }
  
  // Ejecutar inmediatamente y en resize
  forceHeaderTitleSize();
  window.addEventListener('resize', forceHeaderTitleSize);
  
  setTimeout(() => {
    const isMobile = window.innerWidth <= 749;
    const sidebarComponent = document.querySelector('collections-sidebar');
    
    if (sidebarComponent) {
      console.log('✅ Componente Collections Sidebar encontrado en el DOM');
      
      if (!isMobile) {
        // Solo verificar botón desktop en desktop
        const toggleButton = sidebarComponent.querySelector('.collections-sidebar__toggle-button');
        if (toggleButton) {
          const styles = window.getComputedStyle(toggleButton);
          console.log('👁️ Estilos del botón desktop:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex
          });
          
          // Forzar visibilidad como respaldo para desktop
          toggleButton.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            left: 0 !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 9999 !important;
            width: 4rem !important;
            background: #E53E3E !important;
            color: white !important;
            border: none !important;
            border-radius: 0 1.5rem 1.5rem 0 !important;
            padding: 1rem 0.8rem !important;
            cursor: pointer !important;
          `;
          console.log('✅ Botón desktop forzado con estilos');
        } else {
          console.error('❌ Botón desktop de toggle no encontrado');
        }
      } else {
        console.log('📱 Móvil detectado - botón desktop debe estar oculto');
        
        // En móvil, verificar que el botón móvil esté funcionando
        const mobileButton = document.querySelector('#header-collections-mobile-toggle');
        if (mobileButton) {
          console.log('✅ Botón móvil encontrado y listo');
        } else {
          console.error('❌ Botón móvil no encontrado');
        }
      }
    } else {
      console.error('❌ Componente Collections Sidebar no encontrado en el DOM');
    }
  }, 1000);
}); 