class CurrencyTransformer {
  constructor() {
    this.exchangeRate = 1200;
    this.isInitialized = false;
    this.processedElements = new Set();
    
    this.init();
  }

  async init() {
    console.log('🚀 Currency Transformer iniciado');
    
    await this.getExchangeRate();
    this.transformAllPrices();
    this.observeChanges();
    
    this.isInitialized = true;
  }

  async getExchangeRate() {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
      const data = await response.json();
      
      if (data && data.venta) {
        this.exchangeRate = parseFloat(data.venta);
        console.log(`💰 Cotización: $${this.exchangeRate} ARS/USD`);
      }
    } catch (error) {
      console.log('⚠️ Error API, usando fallback:', this.exchangeRate);
    }
  }

  extractUSDPrice(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.includes('ARS') || cleanText.includes('ars')) {
      return null;
    }

    const patterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*\.\d{2})/
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price >= 0.10 && price <= 50000) {
          return price;
        }
      }
    }
    
    return null;
  }

  formatPrice(usdPrice) {
    const arsPrice = Math.round(usdPrice * this.exchangeRate);
    
    return {
      ars: `$${arsPrice.toLocaleString('es-AR')} ARS`,
      usd: `($${usdPrice.toFixed(2)} USD)`
    };
  }

  transformAllPrices() {
    const priceSelectors = [
      '.price-item',
      '.money', 
      '[class*="price"]:not(.currency-converted)',
      'span[class*="text-"]:not(.currency-converted)',
      'div[class*="text-"]:not(.currency-converted)'
    ];

    let transformedCount = 0;

    priceSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        if (this.processedElements.has(element)) return;
        
        if (element.querySelector('.currency-ars') || 
            element.classList.contains('currency-ars') ||
            element.getAttribute('data-transformed')) return;
        
        const hasTextChildren = Array.from(element.children).some(child => 
          child.textContent && child.textContent.trim().includes('$'));
        if (hasTextChildren) return;
        
        const text = element.textContent;
        if (!text || text.length > 100) return;
        
        const usdPrice = this.extractUSDPrice(text);
        if (usdPrice) {
          this.transformElement(element, usdPrice);
          transformedCount++;
        }
      });
    });
  }

  transformElement(element, usdPrice) {
    this.processedElements.add(element);
    
    const formatted = this.formatPrice(usdPrice);
    
    element.innerHTML = `
      <div class="currency-converted">
        <div class="currency-ars">${formatted.ars}</div>
        <div class="currency-usd">${formatted.usd}</div>
      </div>
    `;
    
    element.setAttribute('data-transformed', 'true');
  }

  observeChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldTransform = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                !node.querySelector?.('.currency-converted') &&
                !node.classList?.contains('currency-converted')) {
              shouldTransform = true;
              break;
            }
          }
        }
      });
      
      if (shouldTransform) {
        setTimeout(() => this.transformAllPrices(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}


const style = document.createElement('style');
style.textContent = `
  .currency-converted {
    display: block;
    text-align: center;
    line-height: 1.1;
    width: 100%;
  }
  
  .currency-ars {
    font-weight: bold;
    font-size: 0.85em;
    color: inherit;
    display: block;
    margin-bottom: 1px;
  }
  
  .currency-usd {
    font-size: 0.7em;
    opacity: 0.85;
    color: inherit;
    display: block;
  }
  
  /* Estilos específicos para cards de productos con fondo verde */
  .bg-green-600 .currency-converted {
    color: white;
  }
  
  .bg-green-600 .currency-ars {
    font-size: 1.8em;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    letter-spacing: -0.01em;
  }
  
  .bg-green-600 .currency-usd {
    font-size: 1.3em;
    opacity: 0.9;
    text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  }
  
  /* Para elementos de precio generales */
  .price-item .currency-converted,
  .money .currency-converted {
    display: inline-block;
    text-align: left;
  }
  
  .price-item .currency-ars,
  .money .currency-ars {
    font-size: 1em;
    margin-bottom: 2px;
  }
  
  .price-item .currency-usd,
  .money .currency-usd {
    font-size: 0.75em;
  }
`;
document.head.appendChild(style);


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CurrencyTransformer();
  });
} else {
  new CurrencyTransformer();
}

window.refreshExchangeRate = function() {
  if (window.currencyTransformer) {
    window.currencyTransformer.getExchangeRate();
  }
}; 