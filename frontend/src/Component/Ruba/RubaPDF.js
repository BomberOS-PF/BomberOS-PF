// frontend/src/utils/rubaPdf.js
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generarPdfRUBA(
  {
    incidente,
    intervinientes = [],
    damnificados = [],
    vehiculos = [],
    seguros = {},
    caracteristicas = {}
  },
  {
    generadoPor = 'Usuario',
    fileName = `Sistema_RUBA_${incidente?.idIncidente ?? ''}.pdf`
  } = {}
) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const margin = 12
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const tipo = incidente?.tipoNombre ?? incidente?.tipo ?? 'Incidente'
  const servicio = incidente?.numeroServicio ?? '-'
  const cuerpo = incidente?.cuerpoNombre ?? 'Cuerpo'
  const fecha = incidente?.fecha ?? '-'
  const nroParte = incidente?.numeroParte ?? incidente?.nroParte ?? '-'

  doc.setFontSize(16)
  doc.text('Sistema RUBA', margin, 16)
  doc.setFontSize(14)
  doc.text(`${tipo}`, margin, 24)

  doc.setFontSize(11)
  doc.text(`Servicio: ${servicio}`, margin, 32)
  doc.text(`Cuerpo: ${cuerpo}`, margin, 38)
  doc.text(`Fecha: ${fecha}`, margin, 44)
  doc.text(`Nº Parte: ${nroParte}`, margin, 50)

  let y = 58
  doc.setFontSize(12)
  doc.text('Datos generales', margin, y); y += 6

  const localizacion = incidente?.localizacion?.texto ?? incidente?.localizacion ?? '-'
  const descripcion = incidente?.descripcion ?? '-'

  doc.setFontSize(11)
  doc.text(`Localización: ${localizacion}`, margin, y); y += 6
  doc.text('Descripción:', margin, y); y += 5

  const descLines = doc.splitTextToSize(descripcion, pageW - margin * 2)
  doc.text(descLines, margin, y)
  y += descLines.length * 5 + 2

  doc.setFontSize(12)
  doc.text('Datos del solicitante', margin, y); y += 6
  const solicitante = incidente?.solicitante ?? {}
  doc.setFontSize(11)
  doc.text(`Nombre: ${solicitante?.nombre ?? '-'}`, margin, y); y += 5
  doc.text(`Apellido: ${solicitante?.apellido ?? '-'}`, margin, y); y += 5
  doc.text(`Teléfono: ${solicitante?.telefono ?? '-'}`, margin, y); y += 6

  doc.setFontSize(12)
  doc.text('Datos del seguro', margin, y); y += 6
  doc.setFontSize(11)
  doc.text(`Compañía: ${seguros?.compania ?? '-'}`, margin, y); y += 5
  doc.text(`Póliza: ${seguros?.poliza ?? '-'}`, margin, y); y += 5
  doc.text(`Fecha de Vencimiento: ${seguros?.vencimiento ?? '-'}`, margin, y); y += 7

  doc.setFontSize(12)
  doc.text('Características del lugar', margin, y); y += 6
  doc.setFontSize(11)
  doc.text(`Tipo de lugar: ${caracteristicas?.tipoLugar ?? '-'}`, margin, y); y += 5
  doc.text(`Superficie evacuada: ${caracteristicas?.superficieEvacuada ?? 'No informado'}`, margin, y); y += 7

  if (y > pageH - 80) { doc.addPage(); y = margin }

  doc.setFontSize(12)
  doc.text('Bomberos Heridos / Desaparecidos / Fallecidos', margin, y); y += 6
  doc.setFontSize(11)
  doc.text('No hay datos disponibles', margin, y); y += 8

  doc.setFontSize(12)
  doc.text('Civiles Damnificados', margin, y); y += 6

  if (!damnificados.length) {
    doc.setFontSize(11)
    doc.text('No hay civiles damnificados disponibles', margin, y); y += 8
  } else {
    doc.autoTable({
      startY: y,
      head: [['#', 'Tipo de Daño', 'Nombre', 'Apellido', 'DNI', 'Sexo']],
      body: damnificados.map((d, i) => [
        i + 1, d.tipoDano ?? '-', d.nombre ?? '-', d.apellido ?? '-', d.dni ?? '-', d.sexo ?? '-'
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [213, 43, 30] },
      margin: { left: margin, right: margin }
    })
    y = doc.lastAutoTable.finalY + 6
  }

  doc.setFontSize(12)
  doc.text('Bomberos Intervinientes', margin, y); y += 6

  if (!intervinientes.length) {
    doc.setFontSize(11)
    doc.text('No hay bomberos intervinientes', margin, y); y += 8
  } else {
    doc.autoTable({
      startY: y,
      head: [['#', 'Cuerpo', 'Bombero', 'Inicio', 'Fin', 'Tarea', 'Encargado']],
      body: intervinientes.map((b, i) => [
        i + 1, b.cuerpo ?? '-', b.bombero ?? '-', b.inicio ?? '-', b.fin ?? '-', b.tarea ?? '-', (b.encargado ? 'Sí' : 'No')
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [213, 43, 30] },
      margin: { left: margin, right: margin }
    })
    y = doc.lastAutoTable.finalY + 6
  }

  if (y > pageH - 80) { doc.addPage(); y = margin }

  doc.setFontSize(12)
  doc.text('Comisión Directiva Interviniente', margin, y); y += 6
  doc.setFontSize(11)
  doc.text('No hay miembros de Comisión Directiva Intervinientes', margin, y); y += 8

  doc.setFontSize(12)
  doc.text('Vehículos Intervinientes', margin, y); y += 6

  if (!vehiculos.length) {
    doc.setFontSize(11)
    doc.text('No hay vehículos intervinientes', margin, y); y += 8
  } else {
    doc.autoTable({
      startY: y,
      head: [['#', 'Cuerpo', 'Vehículo', 'Chofer', 'Salida', 'Llegada']],
      body: vehiculos.map((v, i) => [
        i + 1, v.cuerpo ?? '-', v.vehiculo ?? '-', v.chofer ?? '-', v.salida ?? '-', v.llegada ?? '-'
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [213, 43, 30] },
      margin: { left: margin, right: margin }
    })
    y = doc.lastAutoTable.finalY + 6
  }

  if (y > pageH - 40) { doc.addPage(); y = margin }
  doc.setFontSize(12)
  doc.text('Firma', margin, y); y += 16
  doc.setDrawColor(50)
  doc.line(margin, y, margin + 70, y); y += 6
  doc.setFontSize(10)
  doc.text('Aclaración y sello', margin, y)

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(120)
    const h = doc.internal.pageSize.getHeight()
    const w = doc.internal.pageSize.getWidth()
    doc.text(`Generado por: ${generadoPor}`, margin, h - 6)
    doc.text(`Página ${i} de ${total}`, w - margin, h - 6, { align: 'right' })
  }

  doc.save(fileName)
}
