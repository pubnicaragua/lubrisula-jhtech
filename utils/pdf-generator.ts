import { Platform } from "react-native"
import * as FileSystem from "expo-file-system"
import * as Print from "expo-print"
import { formatDate, formatCurrency } from "./helpers"

// Función para generar PDF de informe de vehículo
export const generateVehicleReportPDF = async (vehicle, orders) => {
  try {
    // Obtener logo del taller
    const companyService = await import("../services/company-service")
    const companySettings = await companyService.getCompanySettings()

    // Crear HTML para el PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe de Vehículo</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #eee;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              max-height: 80px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1a73e8;
            }
            .subtitle {
              font-size: 18px;
              color: #666;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1a73e8;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 8px;
              border-bottom: 1px solid #eee;
            }
            .info-table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .order-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .order-table th {
              background-color: #f5f5f5;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .order-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              color: white;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Informe de Vehículo</div>
              <div class="subtitle">${vehicle.make} ${vehicle.model} (${vehicle.year})</div>
            </div>
            <img class="logo" src="${companySettings.logo || "https://example.com/logo.png"}" alt="Logo">
          </div>
          
          <div class="section">
            <div class="section-title">Información General</div>
            <table class="info-table">
              <tr>
                <td>Marca:</td>
                <td>${vehicle.make}</td>
              </tr>
              <tr>
                <td>Modelo:</td>
                <td>${vehicle.model}</td>
              </tr>
              <tr>
                <td>Año:</td>
                <td>${vehicle.year}</td>
              </tr>
              <tr>
                <td>Placa:</td>
                <td>${vehicle.licensePlate}</td>
              </tr>
              ${
                vehicle.vin
                  ? `
              <tr>
                <td>VIN:</td>
                <td>${vehicle.vin}</td>
              </tr>
              `
                  : ""
              }
              ${
                vehicle.color
                  ? `
              <tr>
                <td>Color:</td>
                <td>${vehicle.color}</td>
              </tr>
              `
                  : ""
              }
              ${
                vehicle.mileage
                  ? `
              <tr>
                <td>Kilometraje:</td>
                <td>${vehicle.mileage.toLocaleString()} km</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Especificaciones Técnicas</div>
            <table class="info-table">
              ${
                vehicle.fuelType
                  ? `
              <tr>
                <td>Combustible:</td>
                <td>${
                  vehicle.fuelType === "gasoline"
                    ? "Gasolina"
                    : vehicle.fuelType === "diesel"
                      ? "Diésel"
                      : vehicle.fuelType === "electric"
                        ? "Eléctrico"
                        : vehicle.fuelType === "hybrid"
                          ? "Híbrido"
                          : "Otro"
                }</td>
              </tr>
              `
                  : ""
              }
              ${
                vehicle.transmission
                  ? `
              <tr>
                <td>Transmisión:</td>
                <td>${
                  vehicle.transmission === "manual"
                    ? "Manual"
                    : vehicle.transmission === "automatic"
                      ? "Automática"
                      : vehicle.transmission === "cvt"
                        ? "CVT"
                        : "Otra"
                }</td>
              </tr>
              `
                  : ""
              }
              ${
                vehicle.engineSize
                  ? `
              <tr>
                <td>Motor:</td>
                <td>${vehicle.engineSize}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Mantenimiento</div>
            <table class="info-table">
              ${
                vehicle.lastServiceDate
                  ? `
              <tr>
                <td>Último servicio:</td>
                <td>${formatDate(vehicle.lastServiceDate)}</td>
              </tr>
              `
                  : ""
              }
              ${
                vehicle.nextServiceDate
                  ? `
              <tr>
                <td>Próximo servicio:</td>
                <td>${formatDate(vehicle.nextServiceDate)}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td>Total de servicios:</td>
                <td>${orders.length}</td>
              </tr>
            </table>
          </div>
          
          ${
            vehicle.notes
              ? `
          <div class="section">
            <div class="section-title">Notas</div>
            <p>${vehicle.notes}</p>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <div class="section-title">Historial de Servicios</div>
            ${
              orders.length > 0
                ? `
            <table class="order-table">
              <thead>
                <tr>
                  <th>Orden #</th>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orders
                  .map(
                    (order) => `
                <tr>
                  <td>${order.number}</td>
                  <td>${formatDate(order.dates.created)}</td>
                  <td>${order.description}</td>
                  <td>
                    <div class="status" style="background-color: ${getStatusColorHex(order.status)}">
                      ${getStatusText(order.status)}
                    </div>
                  </td>
                  <td>${formatCurrency(order.total, order.currency)}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            `
                : "<p>No hay historial de servicios para este vehículo.</p>"
            }
          </div>
          
          <div class="footer">
            <p>Este informe fue generado el ${new Date().toLocaleDateString("es-ES")} por ${companySettings.name || "AutoFlowX"}</p>
            <p>${companySettings.address || ""} | ${companySettings.phone || ""} | ${companySettings.email || ""}</p>
          </div>
        </body>
      </html>
    `

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html })

    // En iOS, necesitamos mover el archivo a un directorio compartible
    if (Platform.OS === "ios") {
      const pdfName = `vehiculo_${vehicle.make}_${vehicle.model}_${Date.now()}.pdf`
      const destinationUri = `${FileSystem.documentDirectory}${pdfName}`

      await FileSystem.moveAsync({
        from: uri,
        to: destinationUri,
      })

      return destinationUri
    }

    return uri
  } catch (error) {
    console.error("Error al generar PDF:", error)
    throw error
  }
}

// Función para generar PDF de factura
export const generateInvoicePDF = async (order, client, vehicle, selectedCurrency = order.currency) => {
  try {
    // Obtener logo del taller
    const companyService = await import("../services/company-service")
    const companySettings = await companyService.getCompanySettings()
    
    // Importar servicio de moneda
    const currencyService = await import("../services/currency-service")
    
    // Convertir precios si es necesario
    const convertPrice = (amount, fromCurrency) => {
      if (fromCurrency === selectedCurrency) return amount;
      
      if (fromCurrency === "USD" && selectedCurrency === "HNL") {
        return currencyService.default.convertUSDtoHNL(amount);
      } else if (fromCurrency === "HNL" && selectedCurrency === "USD") {
        return currencyService.default.convertHNLtoUSD(amount);
      }
      
      return amount;
    };

    // Crear HTML para el PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Factura</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #eee;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              max-height: 80px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1a73e8;
            }
            .invoice-info {
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
            }
            .invoice-info-box {
              width: 48%;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1a73e8;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 8px;
              border-bottom: 1px solid #eee;
            }
            .info-table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .items-table th {
              background-color: #f5f5f5;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .items-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              margin-bottom: 5px;
            }
            .total-label {
              display: inline-block;
              width: 150px;
              text-align: right;
              margin-right: 20px;
              font-weight: bold;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              color: #1a73e8;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #eee;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              margin-top: 50px;
              border-top: 1px solid #333;
              padding-top: 10px;
            }
            .currency-note {
              font-size: 12px;
              color: #666;
              font-style: italic;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FACTURA</div>
              <div>Nº: ${order.number}</div>
              <div>Fecha: ${formatDate(order.dates.created)}</div>
              <div class="currency-note">Moneda: ${selectedCurrency === "USD" ? "Dólares (USD)" : "Lempiras (HNL)"}</div>
            </div>
            <img class="logo" src="${companySettings.logo || "https://example.com/logo.png"}" alt="Logo">
          </div>
          
          <div class="invoice-info">
            <div class="invoice-info-box">
              <div class="section-title">Datos del Taller</div>
              <table class="info-table">
                <tr>
                  <td>Nombre:</td>
                  <td>${companySettings.name || "AutoFlowX"}</td>
                </tr>
                <tr>
                  <td>Dirección:</td>
                  <td>${companySettings.address || ""}</td>
                </tr>
                <tr>
                  <td>Teléfono:</td>
                  <td>${companySettings.phone || ""}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td>${companySettings.email || ""}</td>
                </tr>
                ${
                  companySettings.taxId
                    ? `
                <tr>
                  <td>NIF/CIF:</td>
                  <td>${companySettings.taxId}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>
            
            <div class="invoice-info-box">
              <div class="section-title">Datos del Cliente</div>
              <table class="info-table">
                <tr>
                  <td>Nombre:</td>
                  <td>${client.name}</td>
                </tr>
                <tr>
                  <td>Dirección:</td>
                  <td>${client.address || ""}</td>
                </tr>
                <tr>
                  <td>Teléfono:</td>
                  <td>${client.phone || ""}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td>${client.email || ""}</td>
                </tr>
                ${
                  client.taxId
                    ? `
                <tr>
                  <td>NIF/CIF:</td>
                  <td>${client.taxId}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>
          </div>
          
          <div class="section-title">Datos del Vehículo</div>
          <table class="info-table">
            <tr>
              <td>Marca:</td>
              <td>${vehicle.make}</td>
            </tr>
            <tr>
              <td>Modelo:</td>
              <td>${vehicle.model}</td>
            </tr>
            <tr>
              <td>Año:</td>
              <td>${vehicle.year}</td>
            </tr>
            <tr>
              <td>Matrícula:</td>
              <td>${vehicle.licensePlate}</td>
            </tr>
            ${
              vehicle.vin
                ? `
            <tr>
              <td>VIN:</td>
              <td>${vehicle.vin}</td>
            </tr>
            `
                : ""
            }
            ${
              vehicle.mileage
                ? `
            <tr>
              <td>Kilometraje:</td>
              <td>${vehicle.mileage.toLocaleString()} km</td>
            </tr>
            `
                : ""
            }
          </table>
          
          <div class="section-title">Descripción del Servicio</div>
          <p>${order.description}</p>
          ${order.diagnosis ? `<p><strong>Diagnóstico:</strong> ${order.diagnosis}</p>` : ""}
          
          <div class="section-title">Detalle de Repuestos y Servicios</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => {
                    const unitPrice = convertPrice(item.unitPrice, order.currency);
                    const total = unitPrice * item.quantity;
                    return `
                    <tr>
                      <td>${item.name}${item.partNumber ? ` (Ref: ${item.partNumber})` : ""}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(unitPrice, selectedCurrency)}</td>
                      <td>${formatCurrency(total, selectedCurrency)}</td>
                    </tr>
                    `;
                  }
                )
                .join("")}
              <tr>
                <td>Mano de obra</td>
                <td>1</td>
                <td>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</td>
                <td>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal Repuestos:</span>
              <span>${formatCurrency(convertPrice(order.totalParts, order.currency), selectedCurrency)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Mano de Obra:</span>
              <span>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Impuestos:</span>
              <span>${formatCurrency(convertPrice(order.tax, order.currency), selectedCurrency)}</span>
            </div>
            ${
              order.discount
                ? `
            <div class="total-row">
              <span class="total-label">Descuento:</span>
              <span>-${formatCurrency(convertPrice(order.discount.amount, order.currency), selectedCurrency)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span class="total-label">TOTAL:</span>
              <span>${formatCurrency(convertPrice(order.total, order.currency), selectedCurrency)}</span>
            </div>
          </div>
          
          ${
            order.warranty
              ? `
          <div class="section-title">Garantía</div>
          <p>Repuestos: ${order.warranty.parts} meses | Mano de obra: ${order.warranty.labor} meses</p>
          ${order.warranty.notes ? `<p>${order.warranty.notes}</p>` : ""}
          `
              : ""
          }
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">Firma del Técnico</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Firma del Cliente</div>
            </div>
          </div>
          
          <div class="footer">
            <p>${companySettings.invoiceFooter || ""}</p>
            <p>${companySettings.invoiceNotes || ""}</p>
            <p>Este documento fue generado el ${new Date().toLocaleDateString("es-ES")}</p>
          </div>
        </body>
      </html>
    `

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html })

    // En iOS, necesitamos mover el archivo a un directorio compartible
    if (Platform.OS === "ios") {
      const pdfName = `factura_${order.number}_${Date.now()}.pdf`
      const destinationUri = `${FileSystem.documentDirectory}${pdfName}`

      await FileSystem.moveAsync({
        from: uri,
        to: destinationUri,
      })

      return destinationUri
    }

    return uri
  } catch (error) {
    console.error("Error al generar factura PDF:", error)
    throw error
  }
}

// Función para generar PDF de cotización
export const generateQuotePDF = async (order, client, vehicle, selectedCurrency = order.currency) => {
  try {
    // Obtener logo del taller
    const companyService = await import("../services/company-service")
    const companySettings = await companyService.getCompanySettings()
    
    // Importar servicio de moneda
    const currencyService = await import("../services/currency-service")
    
    // Convertir precios si es necesario
    const convertPrice = (amount, fromCurrency) => {
      if (fromCurrency === selectedCurrency) return amount;
      
      if (fromCurrency === "USD" && selectedCurrency === "HNL") {
        return currencyService.default.convertUSDtoHNL(amount);
      } else if (fromCurrency === "HNL" && selectedCurrency === "USD") {
        return currencyService.default.convertHNLtoUSD(amount);
      }
      
      return amount;
    };

    // Crear HTML para el PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cotización</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #eee;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              max-height: 80px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1a73e8;
            }
            .quote-info {
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
            }
            .quote-info-box {
              width: 48%;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1a73e8;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 8px;
              border-bottom: 1px solid #eee;
            }
            .info-table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .items-table th {
              background-color: #f5f5f5;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .items-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              margin-bottom: 5px;
            }
            .total-label {
              display: inline-block;
              width: 150px;
              text-align: right;
              margin-right: 20px;
              font-weight: bold;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              color: #1a73e8;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #eee;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .note {
              margin-top: 30px;
              padding: 15px;
              background-color: #f9f9f9;
              border-left: 4px solid #1a73e8;
            }
            .currency-note {
              font-size: 12px;
              color: #666;
              font-style: italic;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">COTIZACIÓN</div>
              <div>Nº: ${order.number}</div>
              <div>Fecha: ${formatDate(order.dates.created)}</div>
              <div>Válida hasta: ${formatDate(new Date(new Date().setDate(new Date().getDate() + 15)))}</div>
              <div class="currency-note">Moneda: ${selectedCurrency === "USD" ? "Dólares (USD)" : "Lempiras (HNL)"}</div>
            </div>
            <img class="logo" src="${companySettings.logo || "https://example.com/logo.png"}" alt="Logo">
          </div>
          
          <div class="quote-info">
            <div class="quote-info-box">
              <div class="section-title">Datos del Taller</div>
              <table class="info-table">
                <tr>
                  <td>Nombre:</td>
                  <td>${companySettings.name || "AutoFlowX"}</td>
                </tr>
                <tr>
                  <td>Dirección:</td>
                  <td>${companySettings.address || ""}</td>
                </tr>
                <tr>
                  <td>Teléfono:</td>
                  <td>${companySettings.phone || ""}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td>${companySettings.email || ""}</td>
                </tr>
              </table>
            </div>
            
            <div class="quote-info-box">
              <div class="section-title">Datos del Cliente</div>
              <table class="info-table">
                <tr>
                  <td>Nombre:</td>
                  <td>${client.name}</td>
                </tr>
                <tr>
                  <td>Dirección:</td>
                  <td>${client.address || ""}</td>
                </tr>
                <tr>
                  <td>Teléfono:</td>
                  <td>${client.phone || ""}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td>${client.email || ""}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="section-title">Datos del Vehículo</div>
          <table class="info-table">
            <tr>
              <td>Marca:</td>
              <td>${vehicle.make}</td>
            </tr>
            <tr>
              <td>Modelo:</td>
              <td>${vehicle.model}</td>
            </tr>
            <tr>
              <td>Año:</td>
              <td>${vehicle.year}</td>
            </tr>
            <tr>
              <td>Matrícula:</td>
              <td>${vehicle.licensePlate}</td>
            </tr>
            ${
              vehicle.mileage
                ? `
            <tr>
              <td>Kilometraje:</td>
              <td>${vehicle.mileage.toLocaleString()} km</td>
            </tr>
            `
                : ""
            }
          </table>
          
          <div class="section-title">Descripción del Servicio</div>
          <p>${order.description}</p>
          ${order.diagnosis ? `<p><strong>Diagnóstico:</strong> ${order.diagnosis}</p>` : ""}
          
          <div class="section-title">Detalle de Repuestos y Servicios</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => {
                    const unitPrice = convertPrice(item.unitPrice, order.currency);
                    const total = unitPrice * item.quantity;
                    return `
                    <tr>
                      <td>${item.name}${item.partNumber ? ` (Ref: ${item.partNumber})` : ""}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(unitPrice, selectedCurrency)}</td>
                      <td>${formatCurrency(total, selectedCurrency)}</td>
                    </tr>
                    `;
                  }
                )
                .join("")}
              <tr>
                <td>Mano de obra</td>
                <td>1</td>
                <td>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</td>
                <td>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal Repuestos:</span>
              <span>${formatCurrency(convertPrice(order.totalParts, order.currency), selectedCurrency)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Mano de Obra:</span>
              <span>${formatCurrency(convertPrice(order.laborCost, order.currency), selectedCurrency)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Impuestos:</span>
              <span>${formatCurrency(convertPrice(order.tax, order.currency), selectedCurrency)}</span>
            </div>
            ${
              order.discount
                ? `
            <div class="total-row">
              <span class="total-label">Descuento:</span>
              <span>-${formatCurrency(convertPrice(order.discount.amount, order.currency), selectedCurrency)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span class="total-label">TOTAL:</span>
              <span>${formatCurrency(convertPrice(order.total, order.currency), selectedCurrency)}</span>
            </div>
          </div>
          
          <div class="note">
            <p><strong>Nota:</strong> Esta cotización es válida por 15 días a partir de la fecha de emisión. Los precios pueden variar según disponibilidad de repuestos.</p>
            <p>El tiempo estimado para completar el servicio es de ${Math.ceil(Math.random() * 3 + 1)} días hábiles una vez aprobada la cotización.</p>
          </div>
          
          ${
            order.warranty
              ? `
          <div class="section-title">Garantía</div>
          <p>Repuestos: ${order.warranty.parts} meses | Mano de obra: ${order.warranty.labor} meses</p>
          ${order.warranty.notes ? `<p>${order.warranty.notes}</p>` : ""}
          `
              : ""
          }
          
          <div class="footer">
            <p>${companySettings.termsAndConditions || ""}</p>
            <p>Para aceptar esta cotización, por favor contáctenos al ${companySettings.phone || ""} o responda a este correo.</p>
            <p>Este documento fue generado el ${new Date().toLocaleDateString("es-ES")}</p>
          </div>
        </body>
      </html>
    `

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html })

    // En iOS, necesitamos mover el archivo a un directorio compartible
    if (Platform.OS === "ios") {
      const pdfName = `cotizacion_${order.number}_${Date.now()}.pdf`
      const destinationUri = `${FileSystem.documentDirectory}${pdfName}`

      await FileSystem.moveAsync({
        from: uri,
        to: destinationUri,
      })

      return destinationUri
    }

    return uri
  } catch (error) {
    console.error("Error al generar cotización PDF:", error)
    throw error
  }
}

// Función auxiliar para obtener color hexadecimal según estado
const getStatusColorHex = (status) => {
  switch (status) {
    case "reception":
      return "#1a73e8"
    case "diagnosis":
      return "#f5a623"
    case "waiting_parts":
      return "#9c27b0"
    case "in_progress":
      return "#f5a623"
    case "quality_check":
      return "#4caf50"
    case "completed":
      return "#4caf50"
    case "delivered":
      return "#607d8b"
    case "cancelled":
      return "#e53935"
    default:
      return "#666"
  }
}

// Función para obtener texto según estado
const getStatusText = (status) => {
  switch (status) {
    case "reception":
      return "Recepción"
    case "diagnosis":
      return "Diagnóstico"
    case "waiting_parts":
      return "Esperando Repuestos"
    case "in_progress":
      return "En Proceso"
    case "quality_check":
      return "Control de Calidad"
    case "completed":
      return "Completada"
    case "delivered":
      return "Entregada"
    case "cancelled":
      return "Cancelada"
    default:
      return "Desconocido"
  }
}
