// frontend/src/Component/Ruba/RubaPDF.js
import jsPDF from 'jspdf'
import logoRUBA from './LogoRUBA.png'

export function generarPdfRUBA (datos, meta) {
  const { incidente } = datos
  const bomberosParticipantes = datos.bomberosParticipantes || []
  const civilesDamnificados = datos.civilesDamnificados || []
  const { generadoPor } = meta

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4'
  })

  const marginLeft = 20
  const marginRight = 190
  let cursorY = 15

  // -------- ENCABEZADO SUPERIOR --------
  const ahora = new Date()
  const fechaHoraStr = ahora.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(fechaHoraStr, marginLeft, cursorY)
  doc.text('Sistema RUBA', 105, cursorY, { align: 'center' })

  try {
    doc.addImage(logoRUBA, 'PNG', 160, 8, 30, 30)
  } catch (e) {
    console.warn('No se pudo agregar LogoRUBA al PDF', e)
  }

  cursorY += 20

  // -------- TÍTULO PRINCIPAL --------
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  if (incidente.tipoNombre) {
    doc.text(incidente.tipoNombre, marginLeft, cursorY)
    cursorY += 8
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(`Servicio ${incidente.idIncidente}`, marginLeft, cursorY)
  cursorY += 6

  doc.setLineWidth(0.6)
  doc.line(marginLeft, cursorY, marginRight, cursorY)
  cursorY += 8

  // -------- DATOS CABECERA --------
  const cuerpo = 'Asociación Bomberos Voluntarios Despeñaderos.'
  const fechaSoloDia = (incidente.fecha || '').split(' ')[0] || ''
  const nroParte = '25/0124'

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  doc.text('Cuerpo', marginLeft, cursorY)
  doc.setFont('helvetica', 'normal')
  doc.text(` ${cuerpo}`, marginLeft + 18, cursorY)
  cursorY += 7

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha', marginLeft, cursorY)
  doc.setFont('helvetica', 'normal')
  doc.text(` ${fechaSoloDia}`, marginLeft + 18, cursorY)
  cursorY += 7

  doc.setFont('helvetica', 'bold')
  doc.text('Nº Parte', marginLeft, cursorY)
  doc.setFont('helvetica', 'normal')
  doc.text(` ${nroParte}`, marginLeft + 18, cursorY)
  cursorY += 10

  // -------- DATOS GENERALES --------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Datos generales', marginLeft, cursorY)
  cursorY += 5

  doc.setLineWidth(0.2)
  doc.setFontSize(10)

  const colWidths = [30, 30, 35, 35, 40] // total 170
  const headerRow = ['Tipo', 'Categoría', 'Ciudad', 'Provincia', 'Ubicación']

  let x = marginLeft
  const headerHeight = 7

  doc.setFont('helvetica', 'bold')
  headerRow.forEach((txt, idx) => {
    doc.rect(x, cursorY, colWidths[idx], headerHeight)
    doc.text(txt, x + 2, cursorY + 4)
    x += colWidths[idx]
  })

  cursorY += headerHeight

  // Tipo / Categoría según reglas de negocio
  let tipoTexto = ''
  let categoriaTexto = ''

  switch (incidente.tipo) {
    case 2: // Incendio Estructural
      tipoTexto = 'Incendio'
      categoriaTexto = 'Estructural'
      break
    case 3: // Incendio Forestal
      tipoTexto = 'Incendio'
      categoriaTexto = 'Forestal'
      break
    case 4: // Rescate
      tipoTexto = 'Accidente'
      categoriaTexto = 'Rescate'
      break
    case 1: // Accidente de Tránsito
      tipoTexto = 'Accidente'
      categoriaTexto = 'Tránsito'
      break
    case 5: // Material Peligroso
      tipoTexto = 'Accidente'
      categoriaTexto = 'Material Peligroso'
      break
    default:
      tipoTexto = incidente.tipoNombre || 'Incidente'
      categoriaTexto = '-'
      break
  }

  const ciudadTexto = 'Despeñaderos'
  const provinciaTexto = 'Córdoba'
  const ubicacionTexto = incidente.localizacion || '-'

  const dataRow = [
    tipoTexto,
    categoriaTexto,
    ciudadTexto,
    provinciaTexto,
    ubicacionTexto
  ]

  doc.setFont('helvetica', 'normal')

  const lineHeight = 4
  const celdas = dataRow.map((txt, idx) => {
    const maxWidth = colWidths[idx] - 4
    const lines = doc.splitTextToSize(txt, maxWidth)
    const height = lines.length * lineHeight + 3
    return { lines, height }
  })

  const rowHeightDynamic = Math.max(...celdas.map(c => c.height))

  x = marginLeft
  celdas.forEach((celda, idx) => {
    const w = colWidths[idx]
    const h = rowHeightDynamic

    doc.rect(x, cursorY, w, h)
    doc.text(celda.lines, x + 2, cursorY + 4)
    x += w
  })

  cursorY += rowHeightDynamic + 10

  // -------- HELPER GENÉRICO DE TABLAS --------
  const drawTableSection = ({
    title,
    headers,
    colWidthsLocal,
    rows,
    emptyText
  }) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title, marginLeft, cursorY)
    cursorY += 5

    doc.setFontSize(9)
    doc.setLineWidth(0.2)

    let xLocal = marginLeft
    const headerH = 6

    doc.setFont('helvetica', 'bold')
    headers.forEach((txt, idx) => {
      doc.rect(xLocal, cursorY, colWidthsLocal[idx], headerH)
      doc.text(txt, xLocal + 2, cursorY + 4)
      xLocal += colWidthsLocal[idx]
    })

    cursorY += headerH
    const totalWidth = colWidthsLocal.reduce((a, b) => a + b, 0)

    doc.setFont('helvetica', 'normal')

    if (!rows || rows.length === 0) {
      const lines = doc.splitTextToSize(emptyText, totalWidth - 4)
      const h = lines.length * 4 + 3
      doc.rect(marginLeft, cursorY, totalWidth, h)
      doc.text(lines, marginLeft + 2, cursorY + 4)
      cursorY += h + 8
      return
    }

    rows.forEach(row => {
      const cellInfo = row.map((txt, idx) => {
        const maxW = colWidthsLocal[idx] - 4
        const lines = doc.splitTextToSize(String(txt ?? ''), maxW)
        const h = lines.length * 4 + 3
        return { lines, h }
      })

      const rowH = Math.max(...cellInfo.map(c => c.h))
      let xRow = marginLeft

      cellInfo.forEach((cell, idx) => {
        const w = colWidthsLocal[idx]
        doc.rect(xRow, cursorY, w, rowH)
        doc.text(cell.lines, xRow + 2, cursorY + 4)
        xRow += w
      })

      cursorY += rowH
    })

    cursorY += 8
  }

  // -------- BOMBEROS PARTICIPANTES --------
  const headersBomberos = ['#', 'Nombre', 'DNI', 'Teléfono', 'Cuerpo']
  const widthsBomberos = [10, 70, 30, 35, 35] // total ~180

  const rowsBomberos =
    bomberosParticipantes.length > 0
      ? bomberosParticipantes.map(b => [
          b.nro,
          b.nombre,
          b.dni || '',
          b.telefono || '',
          b.cuerpo || ''
        ])
      : []

  drawTableSection({
    title: 'Bomberos Participantes',
    headers: headersBomberos,
    colWidthsLocal: widthsBomberos,
    rows: rowsBomberos,
    emptyText: 'No hay bomberos participantes registrados'
  })

  // -------- CIVILES DAMNIFICADOS --------
  const headersCiviles = ['#', 'Nombre', 'Apellido', 'DNI', 'Sexo', 'Falleció']
  const widthsCiviles = [10, 45, 45, 30, 25, 25]

  const rowsCiviles =
    civilesDamnificados.length > 0
      ? civilesDamnificados.map(d => [
          d.nro,
          d.nombre || '',
          d.apellido || '',
          d.dni || '',
          d.sexo || '',
          d.fallecio || ''
        ])
      : []

  drawTableSection({
    title: 'Civiles Damnificados',
    headers: headersCiviles,
    colWidthsLocal: widthsCiviles,
    rows: rowsCiviles,
    emptyText: 'No hay civiles damnificados disponibles'
  })

  // -------- DESCRIPCIÓN --------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Descripción', marginLeft, cursorY)
  cursorY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const descripcion = incidente.descripcion || 'Sin descripción registrada.'
  const descLines = doc.splitTextToSize(descripcion, marginRight - marginLeft)
  doc.text(descLines, marginLeft, cursorY)
  cursorY += descLines.length * 5 + 8

  // -------- DETALLE (nuevo) --------
  if (incidente.detalle) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Detalle', marginLeft, cursorY)
    cursorY += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const detalleLines = doc.splitTextToSize(incidente.detalle, marginRight - marginLeft)
    doc.text(detalleLines, marginLeft, cursorY)
    cursorY += detalleLines.length * 5 + 8
  }

  // -------- PIE --------
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    `Generado por: ${generadoPor} - ${fechaHoraStr}`,
    marginLeft,
    290
  )

  doc.setTextColor(0)

  return doc
}
