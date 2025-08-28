/**
 * Formatea un número como moneda
 * @param amount Cantidad a formatear
 * @param currency Código de moneda (por defecto: 'NIO' para córdobas nicaragüenses)
 * @returns Cadena formateada como moneda
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'NIO'
): string => {
  // Verificar si el monto es un número válido
  if (isNaN(amount)) {
    return 'C$ 0.00';
  }

  // Formatear como moneda
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  // Usar la configuración regional de Honduras
    localeMatcher: 'best fit'
  })
  .format(amount)
  // Reemplazar el símbolo de moneda por C$ para córdobas
  .replace(/^\D+/, 'C$ ')
  .trim();
};

/**
 * Convierte una cadena de moneda a número
 * @param currencyString Cadena de moneda (ej: "C$ 1,234.56")
 * @returns Número extraído de la cadena de moneda
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Eliminar símbolos de moneda, comas y espacios
  const numberString = currencyString
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '.');
    
  const number = parseFloat(numberString);
  return isNaN(number) ? 0 : number;
};

export default {
  format: formatCurrency,
  parse: parseCurrency,
};
