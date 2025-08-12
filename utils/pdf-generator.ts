import * as Print from 'expo-print'  
import * as FileSystem from 'expo-file-system'  
import { Platform } from 'react-native'  
import { Order } from '../types/order'  
import { Client } from '../types/client'  
import { Vehicle } from '../types/vehicle'  
  
// ✅ CORREGIDO: Tipos explícitos para todas las interfaces  
interface PDFGenerationOptions {  
  includeImages?: boolean  
  currency?: 'USD' | 'HNL'  
  language?: 'es' | 'en'  
}  
  
interface CompanySettings {  
  name: string  
  address: string  
  phone: string  
  email: string  
  logo?: string  
  termsAndConditions?: string  
}  
  
interface CurrencyService {  
  convertUSDtoHNL: (amount: number) => number  
  convertHNLtoUSD: (amount: number) => number  
}  
  
// ✅ CORREGIDO: Función para generar PDF de orden con tipos explícitos  
export const generateOrderPDF = async (  
  order: Order,  
  client: Client,  
  vehicle: Vehicle,  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { includeImages = true, currency = 'USD', language = 'es' } = options  
  
    // Obtener configuración de la empresa  
    const companyService = await import("../services/supabase/company-service")  
    const companySettings: CompanySettings = await companyService.getCompanySettings()  
      
    // Importar servicio de moneda  
    const currencyService = await import("../services/supabase/currency-service")  
    const currencyConverter: CurrencyService = currencyService.default  
      
    // ✅ CORREGIDO: Función de conversión con tipos explícitos  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
        
      if (fromCurrency === "USD" && currency === "HNL") {  
        return currencyConverter.convertUSDtoHNL(amount)  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return currencyConverter.convertHNLtoUSD(amount)  
      }  
        
      return amount  
    }  
  
    // ✅ CORREGIDO: Formatear moneda con tipo explícito  
    const formatCurrency = (amount: number): string => {  
      return amount.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {  
        style: 'currency',  
        currency: currency,  
        minimumFractionDigits: 2,  
      })  
    }  
  
    // ✅ CORREGIDO: Formatear fecha con tipo explícito  
    const formatDate = (dateString: string): string => {  
      const date = new Date(dateString)  
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')  
    }  
  
    // ✅ CORREGIDO: Generar filas de items con tipos explícitos  
    const generateItemRows = (): string => {  
      if (!order.items || order.items.length === 0) {  
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">  
          ${language === 'es' ? 'No hay repuestos agregados' : 'No parts added'}  
        </td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
          
        return `  
          <tr>  
            <td>${item.name}</td>  
            <td style="text-align: center;">${item.quantity}</td>  
            <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
            <td style="text-align: right;">${formatCurrency(total)}</td>  
          </tr>  
        `  
      }).join('')  
    }  
  
    // ✅ CORREGIDO: Calcular totales con tipos explícitos  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    // ✅ CORREGIDO: HTML template con tipos explícitos  
    const html: string = `  
      <!DOCTYPE html>  
      <html>  
        <head>  
          <meta charset="utf-8">  
          <title>${language === 'es' ? 'Orden de Trabajo' : 'Work Order'}</title>  
          <style>  
            body {  
              font-family: 'Helvetica', sans-serif;  
              margin: 0;  
              padding: 20px;  
              color: #333;  
              line-height: 1.6;  
            }  
            .header {  
              display: flex;  
              justify-content: space-between;  
              align-items: center;  
              margin-bottom: 30px;  
              border-bottom: 2px solid #1a73e8;  
              padding-bottom: 20px;  
            }  
            .logo {  
              max-width: 200px;  
              max-height: 80px;  
            }  
            .company-info {  
              text-align: right;  
            }  
            .company-name {  
              font-size: 24px;  
              font-weight: bold;  
              color: #1a73e8;  
              margin-bottom: 5px;  
            }  
            .company-details {  
              font-size: 12px;  
              color: #666;  
            }  
            .title {  
              font-size: 28px;  
              font-weight: bold;  
              color: #1a73e8;  
              text-align: center;  
              margin: 30px 0;  
            }  
            .order-info {  
              display: flex;  
              justify-content: space-between;  
              margin-bottom: 30px;  
            }  
            .info-section {  
              width: 48%;  
            }  
            .section-title {  
              font-size: 16px;  
              font-weight: bold;  
              color: #1a73e8;  
              margin-bottom: 10px;  
              border-bottom: 1px solid #eee;  
              padding-bottom: 5px;  
            }  
            .info-table {  
              width: 100%;  
              border-collapse: collapse;  
            }  
            .info-table td {  
              padding: 5px 0;  
              border-bottom: 1px solid #f0f0f0;  
            }  
            .info-table td:first-child {  
              font-weight: bold;  
              width: 40%;  
              color: #666;  
            }  
            .items-table {  
              width: 100%;  
              border-collapse: collapse;  
              margin: 20px 0;  
            }  
            .items-table th {  
              background-color: #1a73e8;  
              color: white;  
              padding: 12px;  
              text-align: left;  
              font-weight: bold;  
            }  
            .items-table td {  
              padding: 10px 12px;  
              border-bottom: 1px solid #eee;  
            }  
            .items-table tr:nth-child(even) {  
              background-color: #f9f9f9;  
            }  
            .totals-section {  
              margin-top: 30px;  
              border-top: 2px solid #1a73e8;  
              padding-top: 20px;  
            }  
            .totals-table {  
              width: 100%;  
              max-width: 400px;  
              margin-left: auto;  
            }  
            .totals-table td {  
              padding: 8px 0;  
              border-bottom: 1px solid #eee;  
            }  
            .totals-table td:first-child {  
              font-weight: bold;  
              text-align: right;  
              padding-right: 20px;  
            }  
            .totals-table td:last-child {  
              text-align: right;  
              font-weight: bold;  
            }  
            .total-row {  
              border-top: 2px solid #1a73e8;  
              font-size: 18px;  
              color: #1a73e8;  
            }  
            .footer {  
              margin-top: 40px;  
              padding-top: 20px;  
              border-top: 1px solid #eee;  
              font-size: 12px;  
              color: #666;  
              text-align: center;  
            }  
            .status-badge {  
              display: inline-block;  
              padding: 4px 12px;  
              border-radius: 20px;  
              font-size: 12px;  
              font-weight: bold;  
              text-transform: uppercase;  
            }  
            .status-reception { background-color: #fff3cd; color: #856404; }  
            .status-diagnosis { background-color: #d1ecf1; color: #0c5460; }  
            .status-in-progress { background-color: #f8d7da; color: #721c24; }  
            .status-completed { background-color: #d4edda; color: #155724; }  
            .status-delivered { background-color: #d1ecf1; color: #0c5460; }  
          </style>  
        </head>  
        <body>  
          <div class="header">  
            ${companySettings.logo ? `<img src="${companySettings.logo}" alt="Logo" class="logo">` : ''}  
            <div class="company-info">  
              <div class="company-name">${companySettings.name || 'AutoFlowX'}</div>  
              <div class="company-details">  
                ${companySettings.address || ''}<br>  
                ${companySettings.phone || ''}<br>  
                ${companySettings.email || ''}  
              </div>  
            </div>  
          </div>  
  
          <div class="title">${language === 'es' ? 'ORDEN DE TRABAJO' : 'WORK ORDER'}</div>  
  
          <div class="order-info">  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Información de la Orden' : 'Order Information'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Número de Orden:' : 'Order Number:'}</td>  
                  <td>#${order.orderNumber || order.id.slice(0, 8)}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Fecha:' : 'Date:'}</td>  
                  <td>${formatDate(order.created_at)}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Estado:' : 'Status:'}</td>  
                  <td><span class="status-badge status-${order.status}">${order.status}</span></td>  
                </tr>  
                ${order.estimatedCompletionDate ? `  
                <tr>  
                  <td>${language === 'es' ? 'Fecha Estimada:' : 'Estimated Date:'}</td>  
                  <td>${formatDate(order.estimatedCompletionDate)}</td>  
                </tr>  
                ` : ''}  
              </table>  
            </div>  
  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Información del Cliente' : 'Client Information'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Nombre:' : 'Name:'}</td>  
                  <td>${client.name}</td>  
                </tr>  
                ${client.phone ? `  
                <tr>  
                  <td>${language === 'es' ? 'Teléfono:' : 'Phone:'}</td>  
                  <td>${client.phone}</td>  
                </tr>  
                ` : ''}  
                ${client.email ? `  
                <tr>  
                  <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
                  <td>${client.email}</td>  
                </tr>  
                ` : ''}  
              </table>  
            </div>  
          </div>  
  
          <div class="info-section">  
            <div class="section-title">${language === 'es' ? 'Información del Vehículo' : 'Vehicle Information'}</div>  
            <table class="info-table">  
              <tr>  
                <td>${language === 'es' ? 'Marca/Modelo:' : 'Make/Model:'}</td>  
                <td>${vehicle.make} ${vehicle.model}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
                <td>${vehicle.year}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
                <td>${vehicle.license_plate}</td>  
              </tr>  
              ${vehicle.vin ? `  
              <tr>  
                <td>VIN:</td>  
                <td>${vehicle.vin}</td>  
              </tr>  
              ` : ''}  
              ${vehicle.mileage ? `  
              <tr>  
                <td>${language === 'es' ? 'Kilometraje:' : 'Mileage:'}</td>  
                <td>${vehicle.mileage.toLocaleString()} km</td>  
              </tr>  
              ` : ''}  
            </table>  
          </div>  
  
          <div class="section-title">${language === 'es' ? 'Descripción del Trabajo' : 'Work Description'}</div>  
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
            ${order.description || (language === 'es' ? 'Sin descripción' : 'No description')}  
          </p>  
  
          ${order.diagnosis ? `  
          <div class="section-title">${language === 'es' ? 'Diagnóstico' : 'Diagnosis'}</div>  
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
            ${order.diagnosis}  
          </p>  
          ` : ''}  
  
          <div class="section-title">${language === 'es' ? 'Repuestos y Servicios' : 'Parts and Services'}</div>  
          <table class="items-table">  
            <thead>  
              <tr>  
                <th>${language === 'es' ? 'Descripción' : 'Description'}</th>  
                <th style="text-align: center;">${language === 'es' ? 'Cantidad' : 'Quantity'}</th>  
                 <th style="text-align: right;">${language === 'es' ? 'Precio Unit.' : 'Unit Price'}</th>  
                <th style="text-align: right;">${language === 'es' ? 'Total' : 'Total'}</th>  
              </tr>  
            </thead>  
            <tbody>  
              ${generateItemRows()}  
            </tbody>  
          </table>  
  
          <div class="totals-section">  
            <table class="totals-table">  
              <tr>  
                <td>${language === 'es' ? 'Subtotal:' : 'Subtotal:'}</td>  
                <td>${formatCurrency(subtotal)}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Impuestos:' : 'Tax:'}</td>  
                <td>${formatCurrency(tax)}</td>  
              </tr>  
              ${discount > 0 ? `  
              <tr>  
                <td>${language === 'es' ? 'Descuento:' : 'Discount:'}</td>  
                <td>-${formatCurrency(discount)}</td>  
              </tr>  
              ` : ''}  
              <tr class="total-row">  
                <td>${language === 'es' ? 'TOTAL:' : 'TOTAL:'}</td>  
                <td>${formatCurrency(total)}</td>  
              </tr>  
            </table>  
          </div>  
  
          ${order.notes ? `  
          <div class="section-title">${language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}</div>  
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
            ${order.notes}  
          </p>  
          ` : ''}  
  
          <div class="footer">  
            <p>${companySettings.termsAndConditions || ''}</p>  
            <p>${language === 'es' ? 'Este documento fue generado el' : 'This document was generated on'} ${formatDate(new Date().toISOString())}</p>  
          </div>  
        </body>  
      </html>  
    `  
  
    // ✅ CORREGIDO: Generar PDF con tipos explícitos  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    // ✅ CORREGIDO: Manejo de archivos con tipos explícitos  
    if (Platform.OS === "ios") {  
      const pdfName: string = `orden_${order.orderNumber || order.id.slice(0, 8)}_${Date.now()}.pdf`  
      const destinationUri: string = `${FileSystem.documentDirectory}${pdfName}`  
  
      await FileSystem.moveAsync({  
        from: uri,  
        to: destinationUri,  
      })  
  
      return destinationUri  
    }  
  
    return uri  
  } catch (error) {  
    console.error("Error generating order PDF:", error)  
    throw error  
  }  
}  
  
// ✅ CORREGIDO: Función para generar PDF de factura con tipos explícitos  
export const generateInvoicePDF = async (  
  order: Order,  
  client: Client,  
  vehicle: Vehicle,  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { currency = 'USD', language = 'es' } = options  
  
    const companyService = await import("../services/supabase/company-service")  
    const companySettings: CompanySettings = await companyService.getCompanySettings()  
      
    const currencyService = await import("../services/supabase/currency-service")  
    const currencyConverter: CurrencyService = currencyService.default  
  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
        
      if (fromCurrency === "USD" && currency === "HNL") {  
        return currencyConverter.convertUSDtoHNL(amount)  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return currencyConverter.convertHNLtoUSD(amount)  
      }  
        
      return amount  
    }  
  
    const formatCurrency = (amount: number): string => {  
      return amount.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {  
        style: 'currency',  
        currency: currency,  
        minimumFractionDigits: 2,  
      })  
    }  
  
    const formatDate = (dateString: string): string => {  
      const date = new Date(dateString)  
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')  
    }  
  
    const generateInvoiceItems = (): string => {  
      if (!order.items || order.items.length === 0) {  
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">  
          ${language === 'es' ? 'No hay items facturados' : 'No items invoiced'}  
        </td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
          
        return `  
          <tr>  
            <td>${item.name}${item.partNumber ? ` (${item.partNumber})` : ''}</td>  
            <td style="text-align: center;">${item.quantity}</td>  
            <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
            <td style="text-align: right;">${formatCurrency(total)}</td>  
          </tr>  
        `  
      }).join('')  
    }  
  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    const html: string = `  
      <!DOCTYPE html>  
      <html>  
        <head>  
          <meta charset="utf-8">  
          <title>${language === 'es' ? 'Factura' : 'Invoice'}</title>  
          <style>  
            body {  
              font-family: 'Helvetica', sans-serif;  
              margin: 0;  
              padding: 20px;  
              color: #333;  
              line-height: 1.6;  
            }  
            .header {  
              display: flex;  
              justify-content: space-between;  
              align-items: center;  
              margin-bottom: 30px;  
              border-bottom: 2px solid #28a745;  
              padding-bottom: 20px;  
            }  
            .logo {  
              max-width: 200px;  
              max-height: 80px;  
            }  
            .company-info {  
              text-align: right;  
            }  
            .company-name {  
              font-size: 24px;  
              font-weight: bold;  
              color: #28a745;  
              margin-bottom: 5px;  
            }  
            .company-details {  
              font-size: 12px;  
              color: #666;  
            }  
            .title {  
              font-size: 32px;  
              font-weight: bold;  
              color: #28a745;  
              text-align: center;  
              margin: 30px 0;  
            }  
            .invoice-info {  
              display: flex;  
              justify-content: space-between;  
              margin-bottom: 30px;  
            }  
            .info-section {  
              width: 48%;  
            }  
            .section-title {  
              font-size: 16px;  
              font-weight: bold;  
              color: #28a745;  
              margin-bottom: 10px;  
              border-bottom: 1px solid #eee;  
              padding-bottom: 5px;  
            }  
            .info-table {  
              width: 100%;  
              border-collapse: collapse;  
            }  
            .info-table td {  
              padding: 5px 0;  
              border-bottom: 1px solid #f0f0f0;  
            }  
            .info-table td:first-child {  
              font-weight: bold;  
              width: 40%;  
              color: #666;  
            }  
            .items-table {  
              width: 100%;  
              border-collapse: collapse;  
              margin: 20px 0;  
            }  
            .items-table th {  
              background-color: #28a745;  
              color: white;  
              padding: 12px;  
              text-align: left;  
              font-weight: bold;  
            }  
            .items-table td {  
              padding: 10px 12px;  
              border-bottom: 1px solid #eee;  
            }  
            .items-table tr:nth-child(even) {  
              background-color: #f9f9f9;  
            }  
            .totals-section {  
              margin-top: 30px;  
              border-top: 2px solid #28a745;  
              padding-top: 20px;  
            }  
            .totals-table {  
              width: 100%;  
              max-width: 400px;  
              margin-left: auto;  
            }  
            .totals-table td {  
              padding: 8px 0;  
              border-bottom: 1px solid #eee;  
            }  
            .totals-table td:first-child {  
              font-weight: bold;  
              text-align: right;  
              padding-right: 20px;  
            }  
            .totals-table td:last-child {  
              text-align: right;  
              font-weight: bold;  
            }  
            .total-row {  
              border-top: 2px solid #28a745;  
              font-size: 20px;  
              color: #28a745;  
            }  
            .footer {  
              margin-top: 40px;  
              padding-top: 20px;  
              border-top: 1px solid #eee;  
              font-size: 12px;  
              color: #666;  
              text-align: center;  
            }  
            .payment-info {  
              background-color: #f8f9fa;  
              padding: 15px;  
              border-radius: 5px;  
              margin: 20px 0;  
            }  
          </style>  
        </head>  
        <body>  
          <div class="header">  
            ${companySettings.logo ? `<img src="${companySettings.logo}" alt="Logo" class="logo">` : ''}  
            <div class="company-info">  
              <div class="company-name">${companySettings.name || 'AutoFlowX'}</div>  
              <div class="company-details">  
                ${companySettings.address || ''}<br>  
                ${companySettings.phone || ''}<br>  
                ${companySettings.email || ''}  
              </div>  
            </div>  
          </div>  
  
          <div class="title">${language === 'es' ? 'FACTURA' : 'INVOICE'}</div>  
  
          <div class="invoice-info">  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Información de la Factura' : 'Invoice Information'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Número de Factura:' : 'Invoice Number:'}</td>  
                  <td>#${order.orderNumber || order.id.slice(0, 8)}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Fecha de Emisión:' : 'Issue Date:'}</td>  
                  <td>${formatDate(new Date().toISOString())}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Fecha de Vencimiento:' : 'Due Date:'}</td>  
                  <td>${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</td>  
                </tr>  
              </table>  
            </div>  
  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Facturar a:' : 'Bill To:'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Cliente:' : 'Client:'}</td>  
                  <td>${client.name}</td>  
                </tr>  
                ${client.phone ? `  
                <tr>  
                  <td>${language === 'es' ? 'Teléfono:' : 'Phone:'}</td>  
                  <td>${client.phone}</td>  
                </tr>  
                ` : ''}  
                ${client.email ? `  
                <tr>  
                  <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
                  <td>${client.email}</td>  
                </tr>  
                ` : ''}  
                ${client.address ? `  
                <tr>  
                  <td>${language === 'es' ? 'Dirección:' : 'Address:'}</td>  
                  <td>${client.address}</td>  
                </tr>  
                ` : ''}  
              </table>  
            </div>  
          </div>  
  
          <div class="section-title">${language === 'es' ? 'Detalles del Servicio' : 'Service Details'}</div>  
          <table class="items-table">  
            <thead>  
              <tr>  
                <th>${language === 'es' ? 'Descripción' : 'Description'}</th>  
                <th style="text-align: center;">${language === 'es' ? 'Cantidad' : 'Quantity'}</th>  
                <th style="text-align: right;">${language === 'es' ? 'Precio Unit.' : 'Unit Price'}</th>  
                <th style="text-align: right;">${language === 'es' ? 'Total' : 'Total'}</th>  
              </tr>  
            </thead>  
            <tbody>  
              ${generateInvoiceItems()}  
            </tbody>  
          </table>  
  
          <div class="totals-section">  
            <table class="totals-table">  
              <tr>  
                <td>${language === 'es' ? 'Subtotal:' : 'Subtotal:'}</td>  
                <td>${formatCurrency(subtotal)}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Impuestos:' : 'Tax:'}</td>  
                <td>${formatCurrency(tax)}</td>  
              </tr>  
              ${discount > 0 ? `  
              <tr>  
                <td>${language === 'es' ? 'Descuento:' : 'Discount:'}</td>  
                <td>-${formatCurrency(discount)}</td>  
              </tr>  
              ` : ''}  
              <tr class="total-row">  
                <td>${language === 'es' ? 'TOTAL A PAGAR:' : 'TOTAL DUE:'}</td>  
                <td>${formatCurrency(total)}</td>  
              </tr>  
            </table>  
          </div>  
  
          <div class="payment-info">
                      <h3>${language === 'es' ? 'Información de Pago' : 'Payment Information'}</h3>  
            <p>${language === 'es' ? 'Métodos de pago aceptados: Efectivo, Tarjeta de crédito/débito, Transferencia bancaria' : 'Accepted payment methods: Cash, Credit/Debit card, Bank transfer'}</p>  
            <p>${language === 'es' ? 'Términos de pago: 30 días' : 'Payment terms: 30 days'}</p>  
          </div>  
  
          <div class="footer">  
            <p>${companySettings.termsAndConditions || ''}</p>  
            <p>${language === 'es' ? 'Este documento fue generado el' : 'This document was generated on'} ${formatDate(new Date().toISOString())}</p>  
          </div>  
        </body>  
      </html>  
    `  
  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    if (Platform.OS === "ios") {  
      const pdfName: string = `factura_${order.orderNumber || order.id.slice(0, 8)}_${Date.now()}.pdf`  
      const destinationUri: string = `${FileSystem.documentDirectory}${pdfName}`  
  
      await FileSystem.moveAsync({  
        from: uri,  
        to: destinationUri,  
      })  
  
      return destinationUri  
    }  
  
    return uri  
  } catch (error) {  
    console.error("Error generating invoice PDF:", error)  
    throw error  
  }  
}  
  
// ✅ CORREGIDO: Función para generar PDF de reporte de vehículo con tipos explícitos  
export const generateVehicleReportPDF = async (  
  vehicle: Vehicle,  
  orders: Order[],  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { language = 'es' } = options  
  
    const companyService = await import("../services/supabase/company-service")  
    const companySettings: CompanySettings = await companyService.getCompanySettings()  
  
    const formatDate = (dateString: string): string => {  
      const date = new Date(dateString)  
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')  
    }  
  
    const formatCurrency = (amount: number): string => {  
      return amount.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {  
        style: 'currency',  
        currency: 'USD',  
        minimumFractionDigits: 2,  
      })  
    }  
  
    const generateOrderRows = (): string => {  
      if (orders.length === 0) {  
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">  
          ${language === 'es' ? 'No hay órdenes registradas' : 'No orders recorded'}  
        </td></tr>`  
      }  
  
      return orders.map((order) => `  
        <tr>  
          <td>#${order.orderNumber || order.id.slice(0, 8)}</td>  
          <td>${formatDate(order.created_at)}</td>  
          <td>${order.description || (language === 'es' ? 'Sin descripción' : 'No description')}</td>  
          <td>${formatCurrency(order.total || 0)}</td>  
        </tr>  
      `).join('')  
    }  
  
    const html: string = `  
      <!DOCTYPE html>  
      <html>  
        <head>  
          <meta charset="utf-8">  
          <title>${language === 'es' ? 'Reporte de Vehículo' : 'Vehicle Report'}</title>  
          <style>  
            body {  
              font-family: 'Helvetica', sans-serif;  
              margin: 0;  
              padding: 20px;  
              color: #333;  
              line-height: 1.6;  
            }  
            .header {  
              display: flex;  
              justify-content: space-between;  
              align-items: center;  
              margin-bottom: 30px;  
              border-bottom: 2px solid #1a73e8;  
              padding-bottom: 20px;  
            }  
            .title {  
              font-size: 28px;  
              font-weight: bold;  
              color: #1a73e8;  
              text-align: center;  
              margin: 30px 0;  
            }  
            .vehicle-info {  
              background-color: #f8f9fa;  
              padding: 20px;  
              border-radius: 8px;  
              margin-bottom: 30px;  
            }  
            .info-table {  
              width: 100%;  
              border-collapse: collapse;  
              margin-bottom: 20px;  
            }  
            .info-table td {  
              padding: 8px 0;  
              border-bottom: 1px solid #eee;  
            }  
            .info-table td:first-child {  
              font-weight: bold;  
              width: 30%;  
              color: #666;  
            }  
            .orders-table {  
              width: 100%;  
              border-collapse: collapse;  
              margin: 20px 0;  
            }  
            .orders-table th {  
              background-color: #1a73e8;  
              color: white;  
              padding: 12px;  
              text-align: left;  
              font-weight: bold;  
            }  
            .orders-table td {  
              padding: 10px 12px;  
              border-bottom: 1px solid #eee;  
            }  
            .orders-table tr:nth-child(even) {  
              background-color: #f9f9f9;  
            }  
            .summary {  
              background-color: #e8f0fe;  
              padding: 20px;  
              border-radius: 8px;  
              margin-top: 30px;  
            }  
            .footer {  
              margin-top: 40px;  
              padding-top: 20px;  
              border-top: 1px solid #eee;  
              font-size: 12px;  
              color: #666;  
              text-align: center;  
            }  
          </style>  
        </head>  
        <body>  
          <div class="header">  
            <div>  
              <div class="title">${language === 'es' ? 'REPORTE DE VEHÍCULO' : 'VEHICLE REPORT'}</div>  
            </div>  
          </div>  
  
          <div class="vehicle-info">  
            <h3>${language === 'es' ? 'Información del Vehículo' : 'Vehicle Information'}</h3>  
            <table class="info-table">  
              <tr>  
                <td>${language === 'es' ? 'Marca:' : 'Make:'}</td>  
                <td>${vehicle.make}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Modelo:' : 'Model:'}</td>  
                <td>${vehicle.model}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
                <td>${vehicle.year}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
                <td>${vehicle.license_plate}</td>  
              </tr>  
              ${vehicle.vin ? `  
              <tr>  
                <td>VIN:</td>  
                <td>${vehicle.vin}</td>  
              </tr>  
              ` : ''}  
              ${vehicle.mileage ? `  
              <tr>  
                <td>${language === 'es' ? 'Kilometraje:' : 'Mileage:'}</td>  
                <td>${vehicle.mileage.toLocaleString()} km</td>  
              </tr>  
              ` : ''}  
            </table>  
          </div>  
  
          <h3>${language === 'es' ? 'Historial de Servicios' : 'Service History'}</h3>  
          <table class="orders-table">  
            <thead>  
              <tr>  
                <th>${language === 'es' ? 'Orden' : 'Order'}</th>  
                <th>${language === 'es' ? 'Fecha' : 'Date'}</th>  
                <th>${language === 'es' ? 'Descripción' : 'Description'}</th>  
                <th>${language === 'es' ? 'Total' : 'Total'}</th>  
              </tr>  
            </thead>  
            <tbody>  
              ${generateOrderRows()}  
            </tbody>  
          </table>  
  
          <div class="summary">  
            <h3>${language === 'es' ? 'Resumen' : 'Summary'}</h3>  
            <p><strong>${language === 'es' ? 'Total de servicios:' : 'Total services:'}</strong> ${orders.length}</p>  
            <p><strong>${language === 'es' ? 'Gasto total:' : 'Total spent:'}</strong> ${formatCurrency(orders.reduce((sum, order) => sum + (order.total || 0), 0))}</p>  
            <p><strong>${language === 'es' ? 'Último servicio:' : 'Last service:'}</strong> ${orders.length > 0 ? formatDate(orders[0].created_at) : (language === 'es' ? 'N/A' : 'N/A')}</p>  
          </div>  
  
          <div class="footer">  
            <p>${language === 'es' ? 'Este reporte fue generado el' : 'This report was generated on'} ${formatDate(new Date().toISOString())}</p>  
          </div>  
        </body>  
      </html>  
    `  
  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    if (Platform.OS === "ios") {  
      const pdfName: string = `reporte_vehiculo_${vehicle.license_plate}_${Date.now()}.pdf`  
      const destinationUri: string = `${FileSystem.documentDirectory}${pdfName}`  
  
      await FileSystem.moveAsync({  
        from: uri,  
        to: destinationUri,  
      })  
  
      return destinationUri  
    }  
  
    return uri  
  } catch (error) {  
    console.error("Error generating vehicle report PDF:", error)  
    throw error  
  }  
}  
  
// ✅ CORREGIDO: Función para generar PDF de cotización con tipos explícitos  
export const generateQuotePDF = async (  
  order: Order,  
  client: Client,  
  vehicle: Vehicle,  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { currency = 'USD', language = 'es' } = options  
  
    const companyService = await import("../services/supabase/company-service")  
    const companySettings: CompanySettings = await companyService.getCompanySettings()  
      
    const currencyService = await import("../services/supabase/currency-service")  
    const currencyConverter: CurrencyService = currencyService.default  
  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
        
      if (fromCurrency === "USD" && currency === "HNL") {  
        return currencyConverter.convertUSDtoHNL(amount)  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return currencyConverter.convertHNLtoUSD(amount)  
      }  
        
      return amount  
    }  
  
    const formatCurrency = (amount: number): string => {  
      return amount.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {  
        style: 'currency',  
        currency: currency,  
        minimumFractionDigits: 2,  
      })  
    }  
  
    const formatDate = (dateString: string): string => {  
      const date = new Date(dateString)  
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')  
    }  
  
    const generateQuoteItems = (): string => {  
      if (!order.items || order.items.length === 0) {  
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">  
          ${language === 'es' ? 'No hay items en la cotización' : 'No items in quote'}  
        </td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
          
        return `  
          <tr>  
            <td>${item.name}</td>  
            <td style="text-align: center;">${item.quantity}</td>  
            <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
            <td style="text-align: right;">${formatCurrency(total)}</td>  
          </tr>  
        `  
      }).join('')  
    }  
  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    const html: string = `  
      <!DOCTYPE html>  
      <html>  
        <head>  
          <meta charset="utf-8">  
          <title>${language === 'es' ? 'Cotización' : 'Quote'}</title>  
          <style>  
            body {  
              font-family: 'Helvetica', sans-serif;  
              margin: 0;  
              padding: 20px;  
              color: #333;  
              line-height: 1.6;  
            }  
            .header {  
              display: flex;  
              justify-content: space-between;  
              align-items: center;  
              margin-bottom: 30px;  
              border-bottom: 2px solid #ff9800;  
              padding-bottom: 20px;  
            }  
            .title {  
              font-size: 32px;  
              font-weight: bold;  
              color: #ff9800;  
              text-align: center;  
              margin: 30px 0;  
            }  
            .quote-info {  
              display: flex;  
              justify-content: space-between;  
              margin-bottom: 30px;  
            }  
            .info-section {  
              width: 48%;  
            }  
            .section-title {  
              font-size: 16px;  
              font-weight: bold;  
              color: #ff9800;  
              margin-bottom: 10px;  
              border-bottom: 1px solid #eee;  
              padding-bottom: 5px;  
            }  
            .info-table {  
              width: 100%;  
              border-collapse: collapse;  
            }  
            .info-table td {  
              padding: 5px 0;  
              border-bottom: 1px solid #f0f0f0;  
            }  
            .info-table td:first-child {  
              font-weight: bold;  
              width: 40%;  
              color: #666;  
            }  
            .items-table {  
              width: 100%;  
              border-collapse: collapse;  
              margin: 20px 0;  
            }  
            .items-table th {  
              background-color: #ff9800;  
              color: white;  
              padding: 12px;  
              text-align: left;  
              font-weight: bold;  
            }  
            .items-table td {  
              padding: 10px 12px;  
              border-bottom: 1px solid #eee;  
            }  
            .items-table tr:nth-child(even) {  
              background-color: #f9f9f9;  
            }  
            .totals-section {  
              margin-top: 30px;  
              border-top: 2px solid #ff9800;  
              padding-top: 20px;  
            }  
            .totals-table {  
              width: 100%;  
              max-width: 400px;  
              margin-left: auto;  
            }  
            .totals-table td {  
              padding: 8px 0;  
              border-bottom: 1px solid #eee;  
            }  
            .totals-table td:first-child {  
              font-weight: bold;  
              text-align: right;  
              padding-right: 20px;  
            }  
            .totals-table td:last-child {  
              text-align: right;  
              font-weight: bold;  
            }  
            .total-row {  
              border-top: 2px solid #ff9800;  
              font-size: 18px;  
              color: #ff9800;  
            }  
            .footer {  
              margin-top: 40px;  
              padding-top: 20px;  
              border-top: 1px solid #eee;  
              font-size: 12px;  
              color: #666;  
              text-align: center;  
            }  
            .validity-note {  
              background-color: #fff3cd;  
              padding: 15px;  
              border-radius: 5px;  
              margin: 20px 0;  
              border-left: 4px solid #ff9800;  
            }  
          </style>  
        </head>  
        <body>  
          <div class="header">  
            ${companySettings.logo ? `<img src="${companySettings.logo}" alt="Logo" class="logo">` : ''}  
            <div class="company-info">  
              <div class="company-name">${companySettings.name || 'AutoFlowX'}</div>  
              <div class="company-details">  
                ${companySettings.address || ''}<br>  
                ${companySettings.phone || ''}<br>  
                ${companySettings.email || ''}  
              </div>  
            </div>  
          </div>  
  
          <div class="title">${language === 'es' ? 'COTIZACIÓN' : 'QUOTE'}</div>  
  
          <div class="quote-info">  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Información de la Cotización' : 'Quote Information'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Número:' : 'Number:'}</td>  
                  <td>#${order.orderNumber || order.id.slice(0, 8)}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Fecha:' : 'Date:'}</td>  
                  <td>${formatDate(new Date().toISOString())}</td>  
                </tr>  
                <tr>  
                  <td>${language === 'es' ? 'Válida hasta:' : 'Valid until:'}</td>  
                  <td>${formatDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString())}</td>  
                </tr>  
              </table>  
            </div>  
  
            <div class="info-section">  
              <div class="section-title">${language === 'es' ? 'Información del Cliente' : 'Client Information'}</div>  
              <table class="info-table">  
                <tr>  
                  <td>${language === 'es' ? 'Nombre:' : 'Name:'}</td>  
                  <td>${client.name}</td>  
                </tr>  
                ${client.phone ? `  
                <tr>  
                  <td>${language === 'es' ? 'Teléfono:' : 'Phone:'}</td>  
                  <td>${client.phone}</td>  
                </tr>  
                ` : ''}  
                ${client.email ? `  
                <tr>  
                  <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
                  <td>${client.email}</td>  
                </tr>  
                ` : ''}  
              </table>  
            </div>  
          </div>  
  
          <div class="info-section">  
            <div class="section-title">${language === 'es' ? 'Información del Vehículo' : 'Vehicle Information'}</div>  
            <table class="info-table">  
              <tr>  
                <td>${language === 'es' ? 'Marca/Modelo:' : 'Make/Model:'}</td>  
                <td>${vehicle.make} ${vehicle.model}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
                <td>${vehicle.year}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
                <td>${vehicle.license_plate}</td>  
              </tr>  
            </table>  
          </div>  
  
          <div class="section-title">${language === 'es' ? 'Servicios y Repuestos Cotizados' : 'Quoted Services and Parts'}</div>  
          <table class="items-table">  
            <thead>  
              <tr>  
                <th>${language === 'es' ? 'Descripción' : 'Description'}</th>  
                <th style="text-align: center;">${language === 'es' ? 'Cantidad' : 'Quantity'}</th>  
                <th style="text-align: right;">${language === 'es' ? 'Precio Unit.' : 'Unit Price'}</th>  
                <th style="text-align: right;">${language === 'es' ? 'Total' : 'Total'}</th>  
              </tr>  
            </thead>  
            <tbody>  
              ${generateQuoteItems()}  
            </tbody>  
          </table>  
  
          <div class="totals-section">  
            <table class="totals-table">  
              <tr>  
                <td>${language === 'es' ? 'Subtotal:' : 'Subtotal:'}</td>  
                <td>${formatCurrency(subtotal)}</td>  
              </tr>  
              <tr>  
                <td>${language === 'es' ? 'Impuestos:' : 'Tax:'}</td>  
                <td>${formatCurrency(tax)}</td>  
              </tr>  
              ${discount > 0 ? `  
              <tr>  
                <td>${language === 'es' ? 'Descuento:' : 'Discount:'}</td>  
                <td>-${formatCurrency(discount)}</td>  
              </tr>  
              ` : ''}  
              <tr class="total-row">  
                <td>${language === 'es' ? 'TOTAL COTIZADO:' : 'TOTAL QUOTED:'}</td>  
                <td>${formatCurrency(total)}</td>  
              </tr>  
            </table>  
          </div>  
  
          <div class="validity-note">  
            <h3>${language === 'es' ? 'Términos y Condiciones' : 'Terms and Conditions'}</h3>  
            <p><strong>${language === 'es' ? 'Validez:' : 'Validity:'}</strong> ${language === 'es' ? 'Esta cotización es válida por 15 días a partir de la fecha de emisión.' : 'This quote is valid for 15 days from the date of issue.'}</p>  
            <p><strong>${language === 'es' ? 'Precios:' : 'Prices:'}</strong> ${language === 'es' ? 'Los precios pueden variar según disponibilidad de repuestos.' : 'Prices may vary based on parts availability.'}</p>  
            <p><strong>${language === 'es' ? 'Tiempo estimado:' : 'Estimated time:'}</strong> ${language === 'es' ? '2-5 días hábiles una vez aprobada la cotización.' : '2-5 business days once quote is approved.'}</p>  
          </div>  
  
          <div class="footer">  
            <p>${companySettings.termsAndConditions || ''}</p>  
            <p>${language === 'es' ? 'Para aceptar esta cotización, contáctenos al' : 'To accept this quote, contact us at'} ${companySettings.phone || ''}</p>  
            <p>${language === 'es' ? 'Este documento fue generado el' : 'This document was generated on'} ${formatDate(new Date().toISOString())}</p>  
          </div>  
        </body>  
      </html>  
    `  
  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    if (Platform.OS === "ios") {  
      const pdfName: string = `cotizacion_${order.orderNumber || order.id.slice(0, 8)}_${Date.now()}.pdf`  
      const destinationUri: string = `${FileSystem.documentDirectory}${pdfName}`  
  
      await FileSystem.moveAsync({  
        from: uri,  
        to: destinationUri,  
      })  
  
      return destinationUri  
    }  
  
    return uri  
  } catch (error) {  
    console.error("Error generating quote PDF:", error)  
    throw error  
  }  
}  
  
// ✅ CORREGIDO: Función auxiliar para compartir PDF con tipos explícitos  
export const sharePDF = async (uri: string, title: string): Promise<void> => {  
  try {  
    const { Share } = await import('react-native')  
    await Share.share({  
      url: uri,  
      title: title,  
      message: `Documento: ${title}`,  
    })  
  } catch (error) {  
    console.error("Error sharing PDF:", error)  
    throw error  
  }  
}  
  
// ✅ CORREGIDO: Función para validar datos antes de generar PDF  
export const validatePDFData = (order: Order, client: Client, vehicle: Vehicle): boolean => {  
  if (!order || !client || !vehicle) {  
    return false  
  }  
  
  if (!order.id || !client.name || !vehicle.license_plate) {  
    return false  
  }  
  
  return true  
}  
  
export default {  
  generateOrderPDF,  
  generateInvoicePDF,  
  generateVehicleReportPDF,  
  generateQuotePDF,  
  sharePDF,  
  validatePDFData  
}