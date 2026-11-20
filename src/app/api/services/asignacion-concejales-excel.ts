import { Workbook } from 'exceljs';
import { AsignacionConcejalesDto } from '../models/asignacion-concejales-dto';

interface Cociente {
  numeroLista: number;
  numerosLista: string;
  nombreLista: string;
  votos: number;
  divisor: number;
  cociente: number;
  nombreCandidato?: string | null;
}

// Reporte de asignación de escaños (equivalente a ResultadoService.ObtenerAsignacionConcejalesExcelAsync).
export async function generarExcelAsignacionConcejales(asignacion: AsignacionConcejalesDto): Promise<Blob> {
  const totalEscanos = asignacion.totalEscanos ?? 0;
  const metodo = asignacion.metodoEscanos ?? 'DHondt';

  const libro = new Workbook();
  const hoja = libro.addWorksheet('Asignacion de escanos');

  // Encabezado general
  hoja.getCell(1, 1).value = 'ASIGNACIÓN DE ESCAÑOS — CONCEJALES';
  hoja.mergeCells(1, 1, 1, 9);
  hoja.getRow(1).font = { bold: true, size: 14 };
  hoja.getCell(1, 1).alignment = { horizontal: 'center' };
  const datos: Array<[string, string | number]> = [
    ['Elección', asignacion.nombreEleccion ?? ''],
    ['Dignidad', asignacion.dignidad ?? ''],
    ['Tipo de resultado', asignacion.estadoResultado ?? ''],
    ['Método de asignación', metodo],
    ['Total de escaños', totalEscanos],
  ];
  datos.forEach(([etiqueta, valor], i) => {
    hoja.getCell(2 + i, 1).value = etiqueta;
    hoja.getCell(2 + i, 2).value = valor;
  });

  // Cada cociente corresponde al siguiente candidato de la lista
  const cocientes: Cociente[] = [];
  const listas = [...(asignacion.listas ?? [])].sort((a, b) => (a.numeroLista ?? 0) - (b.numeroLista ?? 0));
  for (const lista of listas) {
    const votos = lista.votos ?? 0;
    if (votos <= 0) {
      continue;
    }
    const candidatos = [...(lista.candidatos ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    for (let i = 1; i <= totalEscanos; i++) {
      const divisor = metodo === 'Webster' ? 2 * i - 1 : i;
      cocientes.push({
        numeroLista: lista.numeroLista ?? 0,
        numerosLista: lista.numerosLista ?? '',
        nombreLista: lista.nombreLista ?? '',
        votos,
        divisor,
        cociente: votos / divisor,
        nombreCandidato: candidatos[i - 1]?.nombreCandidato,
      });
    }
  }
  // El orden debe coincidir con el utilizado en la asignación
  cocientes.sort((a, b) => b.cociente - a.cociente || a.numeroLista - b.numeroLista);

  // Tabla detallada: una fila por cada cociente calculado
  const filaEncabezado = 8;
  const encabezados = [
    'N.º Lista',
    'Lista / Alianza',
    'Votos',
    'Divisor',
    'Voto por Candidato',
    'Orden global',
    'Candidato correspondiente',
    'Asignación del escaño',
    'Estado del candidato',
  ];
  const filaTitulos = hoja.getRow(filaEncabezado);
  encabezados.forEach((texto, i) => (filaTitulos.getCell(i + 1).value = texto));
  filaTitulos.font = { bold: true };
  filaTitulos.alignment = { horizontal: 'center' };

  cocientes.forEach((item, i) => {
    const ganador = i < totalEscanos;
    const fila = hoja.getRow(filaEncabezado + 1 + i);
    fila.values = [
      item.numerosLista || String(item.numeroLista),
      item.nombreLista,
      item.votos,
      item.divisor,
      item.cociente,
      i + 1,
      item.nombreCandidato ?? 'Sin candidato disponible',
      ganador ? `Escaño ${i + 1}` : 'No asignado',
      ganador ? (item.nombreCandidato ? 'Electo' : 'Revisar candidato') : 'No electo',
    ];
    // Resaltar los cocientes que ganaron un escaño
    if (ganador) {
      fila.font = { bold: true };
    }
    fila.getCell(1).alignment = { horizontal: 'right' };
    fila.getCell(3).numFmt = '#,##0';
    fila.getCell(4).numFmt = '#,##0';
    fila.getCell(5).numFmt = '#,##0.00';
  });

  // Bordes de la tabla
  const ultimaFila = filaEncabezado + cocientes.length;
  for (let f = filaEncabezado; f <= ultimaFila; f++) {
    for (let c = 1; c <= 9; c++) {
      hoja.getCell(f, c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }

  hoja.views = [{ state: 'frozen', ySplit: filaEncabezado }];
  const anchos = [12, 25, 12, 10, 20, 14, 32, 22, 24];
  anchos.forEach((ancho, i) => (hoja.getColumn(i + 1).width = ancho));

  const buffer = await libro.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
