class CheckoutPriceConverter {
  constructor() {
    this.exchangeRate = 1200; // Fallback rate
    this.isEnabled = true;
    this.originalCheckoutUrls = new Set();
    
    this.init();
  }

  async init() {
    console.log('🚀 Checkout Price Converter iniciado');
    
    // Obtener cotización actual
    await this.getExchangeRate();
    
    // Interceptar botones de checkout
    this.interceptCheckoutButtons();
    
    // Interceptar navigation al checkout
    this.interceptCheckoutNavigation();
  }

  async getExchangeRate() {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
      const data = await response.json();
      
      if (data && data.venta) {
        this.exchangeRate = parseFloat(data.venta);
        console.log(`💰 Cotización checkout: $${this.exchangeRate} ARS/USD`);
      }
    } catch (error) {
      console.log('⚠️ Error API checkout, usando fallback:', this.exchangeRate);
    }
  }

  interceptCheckoutButtons() {
    // Intercept main checkout buttons
    const checkoutButtons = document.querySelectorAll('button[name="checkout"], input[name="checkout"], a[href*="checkout"]');
    
    checkoutButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        if (this.isEnabled) {
          console.log('🔄 Interceptando checkout...');
          event.preventDefault();
          
          await this.convertCartPrices();
          
          // Continue with original checkout
          if (button.type === 'submit' || button.tagName === 'BUTTON') {
            button.form?.submit();
          } else if (button.href) {
            window.location.href = button.href;
          }
        }
      });
    });
  }

  interceptCheckoutNavigation() {
    // Intercept any programmatic navigation to checkout
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = async function(state, title, url) {
      if (url && url.includes('checkout')) {
        await window.checkoutConverter?.convertCartPrices();
      }
      return originalPushState.apply(history, arguments);
    };
    
    history.replaceState = async function(state, title, url) {
      if (url && url.includes('checkout')) {
        await window.checkoutConverter?.convertCartPrices();
      }
      return originalReplaceState.apply(history, arguments);
    };
  }

  async convertCartPrices() {
    try {
      console.log('💱 Preparando checkout con conversión USD → ARS...');
      
      // Store conversion info for checkout
      await this.modifyCheckoutUrl();
      
      // Try to change shop currency to ARS for this session
      await this.switchToARSCurrency();
      
    } catch (error) {
      console.error('❌ Error preparando checkout:', error);
    }
  }

  async switchToARSCurrency() {
    try {
      // Try to switch currency to ARS using Shopify's currency API
      const currencyForm = new FormData();
      currencyForm.append('form_type', 'currency');
      currencyForm.append('currency_code', 'ARS');
      currencyForm.append('return_to', window.location.pathname);

      const response = await fetch('/localization', {
        method: 'POST',
        body: currencyForm
      });

      if (response.ok) {
        console.log('✅ Cambiado a moneda ARS para checkout');
        // Wait a bit for the change to take effect
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('⚠️ No se pudo cambiar moneda, continuando con USD');
      }
    } catch (error) {
      console.log('⚠️ Error cambiando moneda:', error);
    }
  }

  // Alternative approach: Modify checkout URL to include currency parameter
  async modifyCheckoutUrl() {
    try {
      // Get cart permalink with currency parameter
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      
      // Calculate total in ARS
      let totalARS = 0;
      cart.items.forEach(item => {
        const usdPrice = item.price / 100;
        const arsPrice = usdPrice * this.exchangeRate;
        totalARS += arsPrice * item.quantity;
      });
      
      console.log(`Total carrito: $${totalARS.toFixed(2)} ARS`);
      
      // Store conversion info for checkout
      sessionStorage.setItem('checkout_currency_conversion', JSON.stringify({
        exchangeRate: this.exchangeRate,
        totalUSD: cart.total_price / 100,
        totalARS: totalARS,
        convertedAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error modificando checkout:', error);
    }
  }

  // Method to disable conversion (for testing)
  disable() {
    this.isEnabled = false;
    console.log('🔴 Checkout Price Converter deshabilitado');
  }

  enable() {
    this.isEnabled = true;
    console.log('🟢 Checkout Price Converter habilitado');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.checkoutConverter = new CheckoutPriceConverter();
  });
} else {
  window.checkoutConverter = new CheckoutPriceConverter();
}

// Global functions for debugging
window.disableCheckoutConversion = () => window.checkoutConverter?.disable();
window.enableCheckoutConversion = () => window.checkoutConverter?.enable(); 