class CheckoutPriceConverter {
  constructor() {
    this.exchangeRate = 1200; // Fallback rate
    this.isEnabled = true;
    this.originalCheckoutUrls = new Set();
    
    this.init();
  }

  async init() {
    console.log('🚀 Checkout Price Converter iniciado (MODO VISUAL SOLAMENTE)');
    
    // Obtener cotización actual
    await this.getExchangeRate();
    
    // Solo detectar clicks, no interceptar
    this.interceptCheckoutButtons();
    
    // No interceptar navegación
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
    // DESHABILITADO: No interceptar checkout ya que solo es visual
    console.log('💰 Checkout converter en modo visual - no intercepta botones');
    
    // Solo guardar info para referencia, sin interceptar
    const checkoutButtons = document.querySelectorAll('button[name="checkout"], input[name="checkout"], a[href*="checkout"]');
    
    checkoutButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        if (this.isEnabled) {
          console.log('🔄 Click en checkout detectado (modo visual)');
          // NO hacer preventDefault() - dejar que funcione normalmente
          
          // Solo guardar información sin interceptar
          await this.modifyCheckoutUrl();
        }
      });
    });
  }

  interceptCheckoutNavigation() {
    // DESHABILITADO: No interceptar navegación ya que solo es visual
    console.log('🔄 Navegación de checkout en modo visual - sin interceptación');
    
    // No modificar history.pushState ni history.replaceState
    // Dejar que la navegación funcione normalmente
  }

  async convertCartPrices() {
    try {
      console.log('💱 Guardando info de conversión (modo visual)...');
      
      // Solo guardar información para referencia
      await this.modifyCheckoutUrl();
      
      // NO intentar cambiar la moneda real en Shopify
      console.log('💰 Conversión visual completada');
      
    } catch (error) {
      console.error('❌ Error guardando info:', error);
    }
  }

  async switchToARSCurrency() {
    // MÉTODO DESHABILITADO: Causaba error 404 en /localization
    // Solo para conversión visual, no cambiar moneda real
    console.log('💰 switchToARSCurrency() deshabilitado - solo modo visual');
    return;
    
    // CÓDIGO ORIGINAL COMENTADO:
    // try {
    //   const currencyForm = new FormData();
    //   currencyForm.append('form_type', 'currency');
    //   currencyForm.append('currency_code', 'ARS');
    //   currencyForm.append('return_to', window.location.pathname);
    //   const response = await fetch('/localization', { method: 'POST', body: currencyForm });
    //   if (response.ok) {
    //     console.log('✅ Cambiado a moneda ARS para checkout');
    //     await new Promise(resolve => setTimeout(resolve, 1000));
    //   } else {
    //     console.log('⚠️ No se pudo cambiar moneda, continuando con USD');
    //   }
    // } catch (error) {
    //   console.log('⚠️ Error cambiando moneda:', error);
    // }
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