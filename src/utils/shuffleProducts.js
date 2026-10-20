
/**
 * Randomizes products without modifying the original array.
 */
export function shuffleProducts(products = []) {
    const shuffled = [...products];
  
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
  
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  
    return shuffled;
  }
  