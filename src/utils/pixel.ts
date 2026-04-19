export const emitPixelEvent = (eventName: string, data?: any) => {
  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const standardEvents = ['ViewContent', 'AddToCart', 'Purchase', 'AddToWishlist', 'InitiateCheckout', 'Contact', 'Lead'];
    
    if (standardEvents.includes(eventName)) {
        (window as any).fbq('track', eventName, data);
    } else {
        (window as any).fbq('trackCustom', eventName, data);
    }
  }

  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, data);
  }
};
