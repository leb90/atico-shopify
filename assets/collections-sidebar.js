class CollectionsSidebar extends HTMLElement {
  constructor() {
    super();
    
    this.toggleButton = this.querySelector('#collections-sidebar-toggle button');
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
      container: !!this.container
    });
    
    if (!this.toggleButton || !this.container) {
      console.error('❌ Elementos requeridos no encontrados para Collections Sidebar');
      return;
    }
    
    // Forzar visibilidad del botón de múltiples maneras
    const toggleButtonElement = this.querySelector('.collections-sidebar__toggle-button');
    if (toggleButtonElement) {
      toggleButtonElement.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        left: 0 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 101 !important;
      `;
      console.log('✅ Botón de toggle forzado a visible con estilos inline');
    }
    
    // Event listeners para abrir/cerrar
    this.toggleButton.addEventListener('click', this.open.bind(this));
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
    
    console.log('🎯 Collections Sidebar inicializada correctamente');
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.container.classList.add('is-open');
    document.body.classList.add('collections-sidebar-open');
    
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
    
    // Restore body scroll
    this.preventBodyScroll(false);
    
    // Return focus to toggle button
    this.toggleButton?.focus();
    
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

// Verificar que el componente se cargue correctamente
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM cargado, verificando Collections Sidebar...');
  
  setTimeout(() => {
    const sidebarComponent = document.querySelector('collections-sidebar');
    if (sidebarComponent) {
      console.log('✅ Componente Collections Sidebar encontrado en el DOM');
      
      // Double-check que el botón sea visible
      const toggleButton = sidebarComponent.querySelector('.collections-sidebar__toggle-button');
      if (toggleButton) {
        const styles = window.getComputedStyle(toggleButton);
        console.log('👁️ Estilos del botón:', {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex
        });
        
        // Forzar visibilidad como respaldo ultra agresivo
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
        console.log('✅ Botón forzado con estilos ultra agresivos');
      } else {
        console.error('❌ Botón de toggle no encontrado');
      }
    } else {
      console.error('❌ Componente Collections Sidebar no encontrado en el DOM');
      
      // Crear el botón como respaldo de emergencia
      createFallbackButton();
    }
  }, 1000);
});

// Función de respaldo para crear el botón directamente
function createFallbackButton() {
  console.log('🆘 Creando botón de respaldo de emergencia...');
  
  const fallbackButton = document.createElement('div');
  fallbackButton.innerHTML = `
    <button style="
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
      font-size: 12px !important;
      text-align: center !important;
    " onclick="alert('Collections Sidebar - Botón de respaldo funcionando!')">
      📂<br>
      C<br>a<br>t<br>e<br>g<br>o<br>r<br>í<br>a<br>s
    </button>
  `;
  
  document.body.appendChild(fallbackButton);
  console.log('✅ Botón de respaldo creado y agregado al DOM');
} 