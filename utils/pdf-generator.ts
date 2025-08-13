import * as Print from 'expo-print'  
import * as FileSystem from 'expo-file-system'  
import { Platform } from 'react-native'  
import { Order } from '../types/order'  
// ✅ CORREGIDO: Import correcto de tipos centralizados  
import { Client } from '../types'  
import { Vehicle } from '../types'  
  
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
  
// ✅ CORREGIDO: Función para generar PDF de orden con tipos explícitos  
export const generateOrderPDF = async (  
  order: Order,  
  client: Client,  
  vehicle: Vehicle,  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { includeImages = true, currency = 'USD', language = 'es' } = options  
  
    // ✅ CORREGIDO: Configuración de empresa simplificada (sin servicio inexistente)  
    const companySettings: CompanySettings = {  
      name: 'AutoFlowX',  
      address: 'Dirección del Taller',  
      phone: '+504 0000-0000',  
      email: 'info@autoflowx.com',  
      logo: '',  
      termsAndConditions: 'Términos y condiciones del servicio.'  
    }  
  
    // ✅ CORREGIDO: Función de conversión simplificada (sin servicio de moneda)  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
      // Conversión básica USD a HNL (tasa fija para ejemplo)  
      if (fromCurrency === "USD" && currency === "HNL") {  
        return amount * 24.5 // Tasa de ejemplo  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return amount / 24.5  
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
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">${  
          language === 'es' ? 'No hay repuestos agregados' : 'No parts added'  
        }</td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
        return `<tr>  
          <td>${item.name}</td>  
          <td style="text-align: center;">${item.quantity}</td>  
          <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
          <td style="text-align: right;">${formatCurrency(total)}</td>  
        </tr>`  
      }).join('')  
    }  
  
    // ✅ CORREGIDO: Calcular totales con tipos explícitos  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    // ✅ CORREGIDO: HTML template con tipos explícitos  
    const html: string = `<!DOCTYPE html>  
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
      <div class="company-name">${companySettings.name}</div>  
      <div class="company-details">  
        ${companySettings.address}<br>  
        ${companySettings.phone}<br>  
        ${companySettings.email}  
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
          <td>#${order.id.slice(0, 8)}</td>  
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
        </tr>` : ''}  
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
        </tr>` : ''}  
        ${client.email ? `  
        <tr>  
          <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
          <td>${client.email}</td>  
        </tr>` : ''}  
      </table>  
    </div>  
  </div>  
  
  <div class="info-section">  
    <div class="section-title">${language === 'es' ? 'Información del Vehículo' : 'Vehicle Information'}</div>  
    <table class="info-table">  
      <tr>  
        <td>${language === 'es' ? 'Marca/Modelo:' : 'Make/Model:'}</td>  
        <td>${vehicle.marca} ${vehicle.modelo}</td>  
      </tr>  
      <tr>  
        <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
        <td>${vehicle.ano}</td>  
      </tr>  
      <tr>  
        <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
        <td>${vehicle.placa}</td>  
      </tr>  
      ${vehicle.vin ? `  
      <tr>  
        <td>VIN:</td>  
        <td>${vehicle.vin}</td>  
      </tr>` : ''}  
      ${vehicle.kilometraje ? `  
      <tr>  
        <td>${language === 'es' ? 'Kilometraje:' : 'Mileage:'}</td>  
        <td>${vehicle.kilometraje.toLocaleString()} km</td>  
      </tr>` : ''}  
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
  </p>` : ''}  
  
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
      </tr>` : ''}  
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
  </p>` : ''}  
  
  <div class="footer">  
    <p>${companySettings.termsAndConditions || ''}</p>  
    <p>${language === 'es' ? 'Este documento fue generado el' : 'This document was generated on'} ${formatDate(new Date().toISOString())}</p>  
  </div>  
</body>  
</html>`  
  
    // ✅ CORREGIDO: Generar PDF con tipos explícitos  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    // ✅ CORREGIDO: Manejo de archivos con tipos explícitos  
    if (Platform.OS === "ios") {  
      const pdfName: string = `orden_${order.id.slice(0, 8)}_${Date.now()}.pdf`  
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
  
    const companySettings: CompanySettings = {  
      name: 'AutoFlowX',  
      address: 'Dirección del Taller',  
      phone: '+504 0000-0000',  
      email: 'info@autoflowx.com',  
      logo: '',  
      termsAndConditions: 'Términos y condiciones del servicio.'  
    }  
  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
      if (fromCurrency === "USD" && currency === "HNL") {  
        return amount * 24.5  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return amount / 24.5  
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
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">${  
          language === 'es' ? 'No hay items facturados' : 'No items invoiced'  
        }</td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
        return `<tr>  
          <td>${item.name}${item.partNumber ? ` (${item.partNumber})` : ''}</td>  
          <td style="text-align: center;">${item.quantity}</td>  
          <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
          <td style="text-align: right;">${formatCurrency(total)}</td>  
        </tr>`  
      }).join('')  
    }  
  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    const html: string = `<!DOCTYPE html>  
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
      <div class="company-name">${companySettings.name}</div>  
      <div class="company-details">  
        ${companySettings.address}<br>  
        ${companySettings.phone}<br>  
        ${companySettings.email}  
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
          <td>#${order.id.slice(0, 8)}</td>  
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
                  <tr>  
          <td>${language === 'es' ? 'Cliente:' : 'Client:'}</td>  
          <td>${client.name}</td>  
        </tr>  
        ${client.phone ? `  
        <tr>  
          <td>${language === 'es' ? 'Teléfono:' : 'Phone:'}</td>  
          <td>${client.phone}</td>  
        </tr>` : ''}  
        ${client.email ? `  
        <tr>  
          <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
          <td>${client.email}</td>  
        </tr>` : ''}  
        ${client.address ? `  
        <tr>  
          <td>${language === 'es' ? 'Dirección:' : 'Address:'}</td>  
          <td>${client.address}</td>  
        </tr>` : ''}  
      </table>  
    </div>  
  </div>  
  
  <div class="section-title">${language === 'es' ? 'Información del Vehículo' : 'Vehicle Information'}</div>  
  <table class="info-table">  
    <tr>  
      <td>${language === 'es' ? 'Marca/Modelo:' : 'Make/Model:'}</td>  
      <td>${vehicle.marca} ${vehicle.modelo}</td>  
    </tr>  
    <tr>  
      <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
      <td>${vehicle.ano}</td>  
    </tr>  
    <tr>  
      <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
      <td>${vehicle.placa}</td>  
    </tr>  
    ${vehicle.vin ? `  
    <tr>  
      <td>VIN:</td>  
      <td>${vehicle.vin}</td>  
    </tr>` : ''}  
    ${vehicle.kilometraje ? `  
    <tr>  
      <td>${language === 'es' ? 'Kilometraje:' : 'Mileage:'}</td>  
      <td>${vehicle.kilometraje.toLocaleString()} km</td>  
    </tr>` : ''}  
  </table>  
  
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
      </tr>` : ''}  
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
</html>`  
  
    // ✅ CORREGIDO: Generar PDF con tipos explícitos  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    // ✅ CORREGIDO: Manejo de archivos con tipos explícitos  
    if (Platform.OS === "ios") {  
      const pdfName: string = `factura_${order.id.slice(0, 8)}_${Date.now()}.pdf`  
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
  
// ✅ CORREGIDO: Función para generar PDF de cotización con tipos explícitos  
export const generateQuotePDF = async (  
  order: Order,  
  client: Client,  
  vehicle: Vehicle,  
  options: PDFGenerationOptions = {}  
): Promise<string> => {  
  try {  
    const { currency = 'USD', language = 'es' } = options  
  
    const companySettings: CompanySettings = {  
      name: 'AutoFlowX',  
      address: 'Dirección del Taller',  
      phone: '+504 0000-0000',  
      email: 'info@autoflowx.com',  
      logo: '',  
      termsAndConditions: 'Esta cotización es válida por 30 días.'  
    }  
  
    const convertPrice = (amount: number, fromCurrency: string): number => {  
      if (fromCurrency === currency) return amount  
      if (fromCurrency === "USD" && currency === "HNL") {  
        return amount * 24.5  
      } else if (fromCurrency === "HNL" && currency === "USD") {  
        return amount / 24.5  
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
        return `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">${  
          language === 'es' ? 'No hay items cotizados' : 'No items quoted'  
        }</td></tr>`  
      }  
  
      return order.items.map((item) => {  
        const unitPrice: number = convertPrice(item.unitPrice, order.currency || 'USD')  
        const total: number = convertPrice(item.total, order.currency || 'USD')  
        return `<tr>  
          <td>${item.name}</td>  
          <td style="text-align: center;">${item.quantity}</td>  
          <td style="text-align: right;">${formatCurrency(unitPrice)}</td>  
          <td style="text-align: right;">${formatCurrency(total)}</td>  
        </tr>`  
      }).join('')  
    }  
  
    const subtotal: number = convertPrice(order.subtotal || 0, order.currency || 'USD')  
    const tax: number = convertPrice(order.tax || 0, order.currency || 'USD')  
    const discount: number = convertPrice(order.discount || 0, order.currency || 'USD')  
    const total: number = convertPrice(order.total || 0, order.currency || 'USD')  
  
    const html: string = `<!DOCTYPE html>  
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
    .company-name {  
      font-size: 24px;  
      font-weight: bold;  
      color: #ff9800;  
      margin-bottom: 5px;  
    }  
    .title {  
      font-size: 32px;  
      font-weight: bold;  
      color: #ff9800;  
      text-align: center;  
      margin: 30px 0;  
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
      font-size: 20px;  
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
    .validity-info {  
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
    <div class="company-info">  
      <div class="company-name">${companySettings.name}</div>  
      <div class="company-details">  
        ${companySettings.address}<br>  
        ${companySettings.phone}<br>  
        ${companySettings.email}  
      </div>  
    </div>  
  </div>  
  
  <div class="title">${language === 'es' ? 'COTIZACIÓN' : 'QUOTE'}</div>  
  
  <div class="quote-info">  
    <div class="info-section">  
      <div class="section-title">${language === 'es' ? 'Información de la Cotización' : 'Quote Information'}</div>  
      <table class="info-table">  
        <tr>  
          <td>${language === 'es' ? 'Número de Cotización:' : 'Quote Number:'}</td>  
          <td>#${order.id.slice(0, 8)}</td>  
        </tr>  
        <tr>  
          <td>${language === 'es' ? 'Fecha:' : 'Date:'}</td>  
          <td>${formatDate(new Date().toISOString())}</td>  
        </tr>  
        <tr>  
          <td>${language === 'es' ? 'Válida hasta:' : 'Valid until:'}</td>  
          <td>${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</td>  
        </tr>  
      </table>  
    </div>  
  
    <div class="info-section">  
      <div class="section-title">${language === 'es' ? 'Cliente' : 'Client'}</div>  
      <table class="info-table">  
        <tr>  
          <td>${language === 'es' ? 'Nombre:' : 'Name:'}</td>  
          <td>${client.name}</td>  
        </tr>  
        ${client.phone ? `  
        <tr>  
          <td>${language === 'es' ? 'Teléfono:' : 'Phone:'}</td>  
          <td>${client.phone}</td>  
        </tr>` : ''}  
        ${client.email ? `  
        <tr>  
          <td>${language === 'es' ? 'Email:' : 'Email:'}</td>  
          <td>${client.email}</td>  
        </tr>` : ''}  
      </table>  
    </div>  
  </div>  
  
  <div class="section-title">${language === 'es' ? 'Vehículo' : 'Vehicle'}</div>  
  <table class="info-table">  
    <tr>  
            <td>${language === 'es' ? 'Marca/Modelo:' : 'Make/Model:'}</td>  
      <td>${vehicle.marca} ${vehicle.modelo}</td>  
    </tr>  
    <tr>  
      <td>${language === 'es' ? 'Año:' : 'Year:'}</td>  
      <td>${vehicle.ano}</td>  
    </tr>  
    <tr>  
      <td>${language === 'es' ? 'Placa:' : 'License Plate:'}</td>  
      <td>${vehicle.placa}</td>  
    </tr>  
    ${vehicle.vin ? `  
    <tr>  
      <td>VIN:</td>  
      <td>${vehicle.vin}</td>  
    </tr>` : ''}  
    ${vehicle.kilometraje ? `  
    <tr>  
      <td>${language === 'es' ? 'Kilometraje:' : 'Mileage:'}</td>  
      <td>${vehicle.kilometraje.toLocaleString()} km</td>  
    </tr>` : ''}  
  </table>  
  
  <div class="section-title">${language === 'es' ? 'Descripción del Servicio' : 'Service Description'}</div>  
  <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
    ${order.description || (language === 'es' ? 'Sin descripción' : 'No description')}  
  </p>  
  
  ${order.diagnosis ? `  
  <div class="section-title">${language === 'es' ? 'Diagnóstico' : 'Diagnosis'}</div>  
  <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
    ${order.diagnosis}  
  </p>` : ''}  
  
  <div class="section-title">${language === 'es' ? 'Repuestos y Servicios Cotizados' : 'Quoted Parts and Services'}</div>  
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
      </tr>` : ''}  
      <tr class="total-row">  
        <td>${language === 'es' ? 'TOTAL COTIZADO:' : 'TOTAL QUOTED:'}</td>  
        <td>${formatCurrency(total)}</td>  
      </tr>  
    </table>  
  </div>  
  
  <div class="validity-info">  
    <h3>${language === 'es' ? 'Información Importante' : 'Important Information'}</h3>  
    <p><strong>${language === 'es' ? 'Validez:' : 'Validity:'}</strong> ${language === 'es' ? 'Esta cotización es válida por 30 días a partir de la fecha de emisión.' : 'This quote is valid for 30 days from the date of issue.'}</p>  
    <p><strong>${language === 'es' ? 'Tiempo estimado:' : 'Estimated time:'}</strong> ${language === 'es' ? '2-5 días hábiles una vez aprobada la cotización.' : '2-5 business days once the quote is approved.'}</p>  
    <p><strong>${language === 'es' ? 'Garantía:' : 'Warranty:'}</strong> ${language === 'es' ? 'Repuestos: 6 meses | Mano de obra: 3 meses' : 'Parts: 6 months | Labor: 3 months'}</p>  
  </div>  
  
  ${order.notes ? `  
  <div class="section-title">${language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}</div>  
  <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">  
    ${order.notes}  
  </p>` : ''}  
  
  <div class="footer">  
    <p>${companySettings.termsAndConditions || ''}</p>  
    <p><strong>${language === 'es' ? 'Para aceptar esta cotización:' : 'To accept this quote:'}</strong></p>  
    <p>${language === 'es' ? 'Contáctenos al' : 'Contact us at'} ${companySettings.phone} ${language === 'es' ? 'o responda a este correo.' : 'or reply to this email.'}</p>  
    <p>${language === 'es' ? 'Este documento fue generado el' : 'This document was generated on'} ${formatDate(new Date().toISOString())}</p>  
  </div>  
</body>  
</html>`  
  
    // ✅ CORREGIDO: Generar PDF con tipos explícitos  
    const { uri }: { uri: string } = await Print.printToFileAsync({ html })  
  
    // ✅ CORREGIDO: Manejo de archivos con tipos explícitos  
    if (Platform.OS === "ios") {  
      const pdfName: string = `cotizacion_${order.id.slice(0, 8)}_${Date.now()}.pdf`  
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
  
// ✅ CORREGIDO: Función auxiliar para formatear moneda  
const formatCurrency = (amount: number, currency: string): string => {  
  return amount.toLocaleString('es-ES', {  
    style: 'currency',  
    currency: currency,  
    minimumFractionDigits: 2,  
  })  
}  
  
// ✅ CORREGIDO: Función auxiliar para formatear fecha  
const formatDate = (dateString: string): string => {  
  const date = new Date(dateString)  
  return date.toLocaleDateString('es-ES')  
}  
  
// ✅ CORREGIDO: Exportar funciones auxiliares  
export { formatCurrency, formatDate }