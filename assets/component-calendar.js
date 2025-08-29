class CalendarMobile {
  constructor() {
    this.init();
  }

  init() {
    // Solo inicializar en mobile
    if (window.innerWidth > 768) return;
    
    this.bindEvents();
    console.log('📅 Calendario mobile inicializado');
  }

  bindEvents() {
    const calendarDays = document.querySelectorAll('.calendar-day');
    
    calendarDays.forEach(day => {
      day.addEventListener('click', this.handleDayClick.bind(this));
    });

    // Cerrar al hacer clic fuera del día expandido
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    
    // Cerrar con tecla ESC
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleDayClick(event) {
    const day = event.currentTarget;
    
    // Si ya está expandido, cerrarlo
    if (day.classList.contains('expanded')) {
      this.closeDay(day);
      return;
    }

    // Cerrar cualquier otro día expandido
    const expandedDay = document.querySelector('.calendar-day.expanded');
    if (expandedDay) {
      this.closeDay(expandedDay);
    }

    // Expandir el día actual
    this.expandDay(day);
  }

  expandDay(day) {
    day.classList.add('expanded');
    
    // Agregar clase al body para prevenir scroll
    document.body.classList.add('calendar-day-expanded');
    
    // Agregar botón de cerrar
    this.addCloseButton(day);
    
    // Animar entrada
    day.style.animation = 'calendarExpand 0.3s ease-out';
    
    console.log('📅 Día expandido:', day.querySelector('.day-name')?.textContent);
  }

  closeDay(day) {
    day.classList.remove('expanded');
    document.body.classList.remove('calendar-day-expanded');
    
    // Remover botón de cerrar
    this.removeCloseButton(day);
    
    // Animar salida
    day.style.animation = 'calendarCollapse 0.3s ease-out';
    
    // Limpiar animación después de completarse
    setTimeout(() => {
      day.style.animation = '';
    }, 300);
    
    console.log('📅 Día cerrado:', day.querySelector('.day-name')?.textContent);
  }

  addCloseButton(day) {
    // El botón ya está en el CSS con ::before, pero necesitamos funcionalidad
    const closeButton = document.createElement('button');
    closeButton.className = 'calendar-close-btn';
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 30px;
      height: 30px;
      background: #e53e3e;
      color: white;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      z-index: 1001;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDay(day);
    });
    
    day.appendChild(closeButton);
  }

  removeCloseButton(day) {
    const closeButton = day.querySelector('.calendar-close-btn');
    if (closeButton) {
      closeButton.remove();
    }
  }

  handleOutsideClick(event) {
    const expandedDay = document.querySelector('.calendar-day.expanded');
    if (expandedDay && !expandedDay.contains(event.target)) {
      this.closeDay(expandedDay);
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      const expandedDay = document.querySelector('.calendar-day.expanded');
      if (expandedDay) {
        this.closeDay(expandedDay);
      }
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new CalendarMobile();
});

// Reinicializar en resize si cambia a mobile
window.addEventListener('resize', () => {
  if (window.innerWidth <= 768) {
    // Solo reinicializar si no está ya inicializado
    if (!document.querySelector('.calendar-day[data-mobile-initialized]')) {
      new CalendarMobile();
    }
  }
});
