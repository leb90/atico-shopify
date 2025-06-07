// Transformador visual de precios USD a ARS - Global
console.log('🚀 Currency Converter: Iniciando transformación visual...');

class GlobalCurrencyTransformer {
  constructor() {
    this.exchangeRate = null;
    this.exchangeRateExpiry = 0; // Timestamp de expiración
    this.processedElements = new Set();
    this.processedTexts = new Set(); // Para evitar duplicados por texto
    this.isTransforming = false;
    this.lastTransformTime = 0;
    this.init();
  }

  async init() {
    await this.getExchangeRate();
    this.transformAllPrices();
    this.observeChanges();
  }

  async getExchangeRate() {
    const now = Date.now();
    
    // Cache por 15 minutos (900,000 ms)
    if (this.exchangeRate && now < this.exchangeRateExpiry) {
      console.log(`💰 Usando cotización en caché: $${this.exchangeRate} ARS por USD`);
      return this.exchangeRate;
    }

    try {
      console.log('📡 Obteniendo nueva cotización de DolarApi.com...');
      const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
      const data = await response.json();
      this.exchangeRate = data.venta;
      this.exchangeRateExpiry = now + (15 * 60 * 1000); // 15 minutos
      console.log(`💰 Nueva cotización: $${this.exchangeRate} ARS por USD (válida por 15 min)`);
      return this.exchangeRate;
    } catch (error) {
      console.error('❌ Error al obtener cotización:', error);
      if (!this.exchangeRate) {
        this.exchangeRate = 1000; // Fallback solo si no hay cotización previa
        this.exchangeRateExpiry = now + (5 * 60 * 1000); // 5 minutos para fallback
        console.log(`🔄 Usando cotización de emergencia: $${this.exchangeRate}`);
      }
      return this.exchangeRate;
    }
  }

  extractPriceFromText(text, element = null) {
    // Limpiar texto y buscar patrones de precio
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // ⚠️ CRUCIAL: NO procesar si ya contiene "ARS"
    if (cleanText.includes('ARS') || cleanText.includes('ars')) {
      console.log(`❌ Saltando precio ya convertido: "${cleanText}"`);
      return null;
    }

    console.log(`🔍 Analizando texto: "${cleanText}"`);

    // PRIMERA OPCIÓN: Usar data attributes si están disponibles
    if (element) {
      const priceUsdAttr = element.getAttribute('data-price-usd');
      if (priceUsdAttr) {
        const price = parseFloat(priceUsdAttr);
        if (price >= 0.25 && price <= 10000) {
          console.log(`✅ Precio extraído de data-price-usd: $${price}`);
          return price;
        }
      }
    }
    
    // SEGUNDA OPCIÓN: Patrones regex mejorados
    const patterns = [
      // Patrones con USD explícito
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/i,  // $125.00 USD, $1,000.00 USD
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/i,    // 125.00 USD
      
      // Patrones solo con $ - más permisivos
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,        // $125.00 (buscar todas las ocurrencias)
      
      // Patrones numéricos con decimales
      /(\d+(?:,\d{3})*\.\d{2})/g,               // 125.00 (buscar todas las ocurrencias)
      
      // Patrones para números enteros también
      /\$(\d+(?:,\d{3})*)/g,                    // $125 (sin decimales)
      /^(\d+(?:,\d{3})*)$/                      // 125 (solo números enteros)
    ];

    for (const pattern of patterns) {
      const matches = [...cleanText.matchAll(pattern)];
      for (const match of matches) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        
        // Filtrar precios razonables
        if (price >= 0.25 && price <= 10000) {
          console.log(`✅ Precio extraído: "${match[0]}" → $${price}`);
          return price;
        } else {
          console.log(`❌ Precio fuera de rango: $${price}`);
        }
      }
    }
    
    console.log(`❌ No se pudo extraer precio de: "${cleanText}"`);
    return null;
  }

  formatArsPrice(arsAmount) {
    return `$${Math.round(arsAmount).toLocaleString('es-AR')} ARS`;
  }

  formatUsdPrice(usdAmount) {
    return `($${usdAmount.toFixed(2)} USD)`;
  }

  convertUsdToArs(usdAmount) {
    return usdAmount * this.exchangeRate;
  }

  transformAllPrices() {
    // Evitar transformaciones paralelas
    if (this.isTransforming) {
      console.log('⏸️ Transformación ya en progreso, saltando...');
      return;
    }

    // Throttling: evitar transformaciones muy frecuentes
    const now = Date.now();
    if (now - this.lastTransformTime < 3000) { // Mínimo 3 segundos entre transformaciones
      console.log('⏰ Transformación muy reciente, saltando...');
      return;
    }

    this.isTransforming = true;
    this.lastTransformTime = now;
    console.log('🔄 Buscando y transformando precios...');

    let transformedCount = 0;

    try {
      // PRIMERA FASE: Elementos específicos de precio de Shopify
      const shopifyPriceSelectors = [
        '.currency-price-wrapper:not([data-currency-transformed]):not(:has(.currency-converted))',
        '.price-item:not([data-currency-transformed]):not(:has(.currency-converted))',
        '.price-item--regular:not([data-currency-transformed]):not(:has(.currency-converted))',
        '.price-item--sale:not([data-currency-transformed]):not(:has(.currency-converted))',
        '.money:not([data-currency-transformed]):not(:has(.currency-converted))'
      ];

      shopifyPriceSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`🎯 Selector "${selector}": ${elements.length} elementos`);
        }
        
        elements.forEach(element => {
          if (this.transformPriceElement(element)) {
            transformedCount++;
          }
        });
      });

      console.log(`✅ Transformados ${transformedCount} precios en total`);
    } finally {
      this.isTransforming = false;
    }
  }

  transformPriceElement(element) {
    // Verificaciones ESTRICTAS para evitar duplicados
    if (this.processedElements.has(element) || 
        element.hasAttribute('data-currency-transformed') ||
        element.querySelector('.currency-converted') ||
        element.closest('[data-currency-transformed]')) {
      return false;
    }

    const originalText = element.textContent.trim();
    
    // ⚠️ VERIFICACIONES MEJORADAS para evitar re-procesamiento
    if (this.processedTexts.has(originalText) ||
        element.hasAttribute('data-currency-transformed') ||
        element.querySelector('.currency-converted') ||
        originalText.includes('ARS') ||
        originalText.includes('ars') ||
        originalText.match(/\$[\d,.]+ ARS/i) ||
        originalText.includes('currency-converted')) {
      console.log(`❌ Saltando elemento ya procesado o convertido: "${originalText}"`);
      return false;
    }

    const usdPrice = this.extractPriceFromText(originalText, element);

    if (!usdPrice || usdPrice <= 0) {
      return false;
    }

    const arsPrice = this.convertUsdToArs(usdPrice);
    const formattedArs = this.formatArsPrice(arsPrice);
    const formattedUsd = this.formatUsdPrice(usdPrice);

    // Mantener clases originales del elemento
    const originalClasses = element.className;
    
    // Asegurar que el elemento padre tenga posición relativa
    if (element.closest('.card-wrapper, .product-card, .card')) {
      const cardContainer = element.closest('.card-wrapper, .product-card, .card');
      cardContainer.style.position = 'relative';
    } else {
      element.parentElement.style.position = 'relative';
    }

    // Crear la nueva estructura visual con estilo moderno rectangular blanco
    element.innerHTML = `
      <div class="modern-price-tag">
        <div class="modern-price-content">
          <div class="currency-converted" data-converted="true">
            <span class="price-ars-main">
              ${formattedArs}
            </span>
            <span class="price-usd-secondary">
              ${formattedUsd}
            </span>
          </div>
        </div>
      </div>
    `;

    // Marcar como procesado de MÚLTIPLES formas
    this.processedElements.add(element);
    this.processedTexts.add(originalText);
    this.processedTexts.add(formattedArs); // También marcar el resultado
    this.processedTexts.add(formattedUsd); // También marcar el USD formateado
    element.setAttribute('data-currency-transformed', 'true');
    element.setAttribute('data-original-usd', usdPrice);
    element.setAttribute('data-original-text', originalText);
    
    // Marcar también los elementos internos para evitar reprocesamiento
    const convertedElements = element.querySelectorAll('.currency-converted, .price-ars-main, .price-usd-secondary');
    convertedElements.forEach(el => {
      el.setAttribute('data-processed', 'true');
      this.processedTexts.add(el.textContent?.trim() || '');
    });

    console.log(`💱 ✅ Transformado: "${originalText}" → ${formattedArs} ${formattedUsd}`);
    return true;
  }

  observeChanges() {
    // Observador MÁS RESTRICTIVO
    const observer = new MutationObserver((mutations) => {
      let shouldRetransform = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Solo considerar nodos que NO sean nuestras transformaciones
          const hasRelevantNodes = [...mutation.addedNodes].some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            
            // ⚠️ IGNORAR COMPLETAMENTE nuestras transformaciones
            if (node.classList?.contains('currency-converted') || 
                node.classList?.contains('modern-price-tag') ||
                node.classList?.contains('modern-price-content') ||
                node.classList?.contains('price-ars-main') ||
                node.classList?.contains('price-usd-secondary') ||
                node.hasAttribute?.('data-currency-transformed') ||
                node.hasAttribute?.('data-converted') ||
                node.hasAttribute?.('data-processed') ||
                node.closest?.('[data-currency-transformed]') ||
                node.closest?.('.modern-price-tag') ||
                node.querySelector?.('.currency-converted') ||
                node.querySelector?.('.modern-price-tag')) {
              return false;
            }
            
            // Solo considerar si tiene contenido USD que NO sea ARS
            const text = node.textContent || '';
            const hasUSD = text.includes('USD') && !text.includes('ARS');
            const hasDollarSign = text.includes('$') && !text.includes('ARS');
            
            return hasUSD || (hasDollarSign && node.querySelector?.('.price-item, .money, .product-price'));
          });
          
          if (hasRelevantNodes) {
            shouldRetransform = true;
            console.log('👀 Detectado contenido con precios USD nuevos');
          }
        }
      });

      if (shouldRetransform && !this.isTransforming) {
        console.log('🔄 Programando re-transformación...');
        setTimeout(() => {
          if (!this.isTransforming) {
            this.transformAllPrices();
          }
        }, 5000); // Delay más largo
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Método público para re-transformar
  retransform() {
    console.log('🔄 Re-transformando precios manualmente...');
    this.processedElements.clear();
    this.processedTexts.clear();
    this.isTransforming = false;
    this.lastTransformTime = 0;
    
    // Limpiar transformaciones anteriores
    document.querySelectorAll('[data-currency-transformed]').forEach(el => {
      const originalText = el.getAttribute('data-original-text');
      if (originalText) {
        el.textContent = originalText;
      }
      el.removeAttribute('data-currency-transformed');
      el.removeAttribute('data-original-usd');
      el.removeAttribute('data-original-text');
    });
    
    this.transformAllPrices();
  }

  // Método para actualizar cotización manualmente
  async updateExchangeRate() {
    console.log('🔄 Actualizando cotización manualmente...');
    this.exchangeRateExpiry = 0; // Forzar actualización
    await this.getExchangeRate();
    this.retransform();
  }
}

// Inicialización
function initTransformer() {
  console.log('🚀 Inicializando Currency Transformer...');
  
  if (window.currencyTransformer) {
    console.log('⚠️ Transformer ya existe, saltando inicialización');
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM listo, iniciando transformador...');
      setTimeout(() => {
        window.currencyTransformer = new GlobalCurrencyTransformer();
      }, 1500);
    });
  } else {
    console.log('📄 DOM ya listo, iniciando transformador inmediatamente...');
    setTimeout(() => {
      window.currencyTransformer = new GlobalCurrencyTransformer();
    }, 800);
  }
}

// Funciones globales para debugging
window.retransformPrices = () => {
  if (window.currencyTransformer) {
    window.currencyTransformer.retransform();
  } else {
    console.log('⚠️ Transformer not ready yet');
  }
};

window.updateExchangeRate = () => {
  if (window.currencyTransformer) {
    window.currencyTransformer.updateExchangeRate();
  } else {
    console.log('⚠️ Transformer not ready yet');
  }
};

window.checkExchangeRate = () => {
  if (window.currencyTransformer) {
    const now = Date.now();
    const timeLeft = Math.max(0, window.currencyTransformer.exchangeRateExpiry - now);
    const minutesLeft = Math.floor(timeLeft / 60000);
    console.log(`Current rate: $${window.currencyTransformer.exchangeRate} ARS per USD`);
    console.log(`Cache expires in: ${minutesLeft} minutes`);
  }
};

// Inicializar
initTransformer();

// Solo eventos críticos de Shopify (MENOS FRECUENTES)
document.addEventListener('shopify:section:load', () => {
  console.log('🔄 Sección de Shopify cargada');
  setTimeout(() => {
    if (window.currencyTransformer && !window.currencyTransformer.isTransforming) {
      window.currencyTransformer.transformAllPrices();
    }
  }, 2000);
});

document.addEventListener('variant:change', () => {
  console.log('🔄 Variante cambiada');
  setTimeout(() => {
    if (window.currencyTransformer && !window.currencyTransformer.isTransforming) {
      window.currencyTransformer.transformAllPrices();
    }
  }, 1500);
}); 