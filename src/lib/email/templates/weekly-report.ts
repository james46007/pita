export interface WeeklyReportEmailProps {
  adminName: string
  complexName: string
  periodStr: string
  totalRevenue: number
  confirmedBookingsCount: number
  occupancyRate: number
  totalHoursPlayed?: number
  dashboardUrl?: string
}

export function renderWeeklyReportEmail(props: WeeklyReportEmailProps): string {
  const {
    adminName,
    complexName,
    periodStr,
    totalRevenue,
    confirmedBookingsCount,
    occupancyRate,
    totalHoursPlayed,
    dashboardUrl = "https://pita.app/dashboard",
  } = props

  const formattedRevenue = `$${Number(totalRevenue).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Semanal de Rendimiento - ${complexName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #09090b 0%, #18181b 100%); padding: 32px 28px; text-align: center; border-bottom: 3px solid #10b981;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                      Resumen Ejecutivo Semanal
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      ${complexName}
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px;">
                      ${periodStr}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 15px; line-height: 1.5;">
                Hola <strong>${adminName}</strong>, aquí tienes el balance de operaciones y recaudación de tu complejo durante los últimos 7 días:
              </p>

              <!-- Main KPI Big Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #a7f3d0; border-radius: 14px; margin-bottom: 24px; text-align: center; padding: 24px 16px;">
                <tr>
                  <td>
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #047857; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Ingresos Totales Confirmados
                    </span>
                    <span style="display: block; font-size: 34px; font-weight: 900; color: #065f46; letter-spacing: -1px;">
                      ${formattedRevenue}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Two Column Secondary KPIs -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; text-align: center;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                      Turnos Confirmados
                    </span>
                    <span style="font-size: 24px; font-weight: 800; color: #0f172a;">
                      ${confirmedBookingsCount}
                    </span>
                  </td>
                  <td width="4%">&nbsp;</td>
                  <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; text-align: center;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                      Tasa de Ocupación
                    </span>
                    <span style="font-size: 24px; font-weight: 800; color: #2563eb;">
                      ${occupancyRate}%
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA to Dashboard -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);">
                      Ver Análisis Detallado en el Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.5; text-align: center;">
                Recibes este reporte todos los lunes para mantener el control total de tu negocio sin esfuerzo.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 20px 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                Generado por el módulo de automatizaciones de <strong>PITA Platform</strong> para <strong>${complexName}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
