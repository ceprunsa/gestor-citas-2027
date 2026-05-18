import ExcelJS from "exceljs";
import type { Appointment } from "../types";

export interface ExcelExportOptions {
  startDate?: string;
  endDate?: string;
  filename?: string;
}

export const exportAppointmentsToExcel = async (
  appointments: Appointment[],
  options: ExcelExportOptions = {},
) => {
  try {
    // Filtrar por rango de fechas si se especifica
    let filteredAppointments = appointments;

    if (options.startDate || options.endDate) {
      filteredAppointments = appointments.filter((appointment) => {
        const appointmentDate = appointment.date;

        if (options.startDate && appointmentDate < options.startDate) {
          return false;
        }

        if (options.endDate && appointmentDate > options.endDate) {
          return false;
        }

        return true;
      });
    }

    // Crear el libro de trabajo
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CEPRUNSA - Sistema de Citas Psicológicas";
    workbook.lastModifiedBy = "Sistema CEPRUNSA";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Crear la hoja de trabajo
    const worksheet = workbook.addWorksheet("Citas Psicológicas", {
      properties: {
        tabColor: { argb: "FF0066CC" },
      },
    });

    // Definir las columnas con formato
    worksheet.columns = [
      { header: "Nombre del Cliente", key: "clientName", width: 25 },
      { header: "DNI", key: "dni", width: 12 },
      { header: "Situación", key: "situation", width: 12 },
      { header: "Teléfono", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Fecha", key: "date", width: 12 },
      { header: "Hora", key: "time", width: 8 },
      { header: "Modalidad", key: "modality", width: 12 },
      { header: "Ubicación", key: "location", width: 20 },
      { header: "Psicólogo", key: "psychologist", width: 25 },
      { header: "Proceso", key: "process", width: 20 },
      { header: "Motivo de Consulta", key: "reason", width: 25 },
      { header: "Estado", key: "status", width: 12 },
      { header: "Edad", key: "age", width: 8 },
      { header: "Sexo", key: "gender", width: 12 },
      { header: "Lugar de Nacimiento", key: "birthPlace", width: 20 },
      { header: "Fecha de Nacimiento", key: "birthDate", width: 15 },
      { header: "Residencia Actual", key: "currentResidence", width: 20 },
      { header: "Estado Civil", key: "maritalStatus", width: 15 },
      { header: "Grado de Instrucción", key: "educationLevel", width: 25 },
      { header: "Postulación Actual", key: "currentApplication", width: 20 },
      {
        header: "Postulaciones Previas",
        key: "previousApplications",
        width: 15,
      },
      {
        header: "Fecha 1era Evaluación",
        key: "firstEvaluationDate",
        width: 18,
      },
      { header: "Motivo de Cancelación", key: "cancellationReason", width: 50 },
      {
        header:
          "Encuesta de satisfacción: ¿Se siente satisfecho con el servicio brindado?",
        key: "satisfiedWithService",
        width: 25,
      },
      {
        header:
          "Encuesta de satisfacción: ¿La atención inició a la hora programada?",
        key: "startedOnTime",
        width: 25,
      },
      {
        header:
          "Encuesta de satisfacción: ¿El trato del profesional fue amable y respetuoso?",
        key: "respectfulTreatment",
        width: 25,
      },
      { header: "Fecha de Creación", key: "createdAt", width: 18 },
      { header: "Creado por", key: "createdBy", width: 20 },
      { header: "Fecha de Actualización", key: "updatedAt", width: 18 },
      { header: "Actualizado por", key: "updatedBy", width: 20 },
      { header: "Tiene Documento", key: "hasDocument", width: 15 },
      { header: "Con Derivación Psicológica", key: "hasPsychologicalReferral", width: 22 },
    ];

    // Estilo para el header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0066CC" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    // Agregar los datos
    filteredAppointments.forEach((appointment) => {
      const row = worksheet.addRow({
        clientName: appointment.client.fullName,
        dni: appointment.client.dni,
        situation:
          appointment.client.situation === "ceprunsa"
            ? "CEPRUNSA"
            : "Particular",
        phone: appointment.client.phone,
        email: appointment.client.email,
        date: new Date(appointment.date + "T00:00:00"),
        time: appointment.time,
        modality:
          appointment.modality === "presential" ? "Presencial" : "Virtual",
        location: appointment.location,
        psychologist: appointment.psychologistName,
        process: appointment.processName || "No asignado",
        reason: appointment.reasonName,
        status: getStatusDisplayName(appointment.status),
        age: appointment.age || "",
        gender: appointment.gender
          ? appointment.gender.charAt(0).toUpperCase() +
            appointment.gender.slice(1)
          : "",
        birthPlace: appointment.birthPlace || "",
        birthDate: appointment.birthDate
          ? new Date(appointment.birthDate + "T00:00:00")
          : "",
        currentResidence: appointment.currentResidence || "",
        maritalStatus: appointment.maritalStatus
          ? appointment.maritalStatus.charAt(0).toUpperCase() +
            appointment.maritalStatus.slice(1)
          : "",
        educationLevel: appointment.educationLevel
          ? getEducationLevelDisplayName(appointment.educationLevel)
          : "",
        currentApplication: appointment.currentApplication || "",
        previousApplications:
          appointment.previousApplications !== undefined
            ? appointment.previousApplications
            : "",
        firstEvaluationDate: appointment.firstEvaluationDate
          ? new Date(appointment.firstEvaluationDate + "T00:00:00")
          : "",
        cancellationReason: appointment.cancellationReason || "",
        satisfiedWithService: appointment.satisfactionSurvey
          ? appointment.satisfactionSurvey.satisfiedWithService
            ? "Sí"
            : "No"
          : "",
        startedOnTime: appointment.satisfactionSurvey
          ? appointment.satisfactionSurvey.startedOnTime
            ? "Sí"
            : "No"
          : "",
        respectfulTreatment: appointment.satisfactionSurvey
          ? appointment.satisfactionSurvey.respectfulTreatment
            ? "Sí"
            : "No"
          : "",
        createdAt: appointment.createdAt ? new Date(appointment.createdAt) : "",
        createdBy: appointment.createdBy || "",
        updatedAt: appointment.updatedAt ? new Date(appointment.updatedAt) : "",
        updatedBy: appointment.updatedBy || "",
        hasDocument: appointment.document ? "Sí" : "No",
        hasPsychologicalReferral: appointment.hasPsychologicalReferral ? "Sí" : "No",
      });

      // Aplicar formato condicional según el estado
      const statusCell = row.getCell("status");
      switch (appointment.status) {
        case "completed":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD4EDDA" },
          };
          statusCell.font = { color: { argb: "FF155724" } };
          break;
        case "cancelled":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8D7DA" },
          };
          statusCell.font = { color: { argb: "FF721C24" } };
          break;
        case "no-show":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFEAA7" },
          };
          statusCell.font = { color: { argb: "FF856404" } };
          break;
        case "scheduled":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1ECF1" },
          };
          statusCell.font = { color: { argb: "FF0C5460" } };
          break;
      }

      // Formato condicional para derivación psicológica
      const referralCell = row.getCell("hasPsychologicalReferral");
      if (appointment.hasPsychologicalReferral) {
        referralCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCCFBF1" }, // teal-100
        };
        referralCell.font = { color: { argb: "FF0D9488" } }; // teal-600
      } else {
        referralCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" }, // gray-100
        };
        referralCell.font = { color: { argb: "FF6B7280" } }; // gray-500
      }

      // Formato para fechas
      const dateCell = row.getCell("date");
      if (dateCell.value instanceof Date) {
        dateCell.numFmt = "dd/mm/yyyy";
      }

      const birthDateCell = row.getCell("birthDate");
      if (birthDateCell.value instanceof Date) {
        birthDateCell.numFmt = "dd/mm/yyyy";
      }

      const firstEvaluationDateCell = row.getCell("firstEvaluationDate");
      if (firstEvaluationDateCell.value instanceof Date) {
        firstEvaluationDateCell.numFmt = "dd/mm/yyyy";
      }

      const createdAtCell = row.getCell("createdAt");
      if (createdAtCell.value instanceof Date) {
        createdAtCell.numFmt = "dd/mm/yyyy hh:mm:ss";
      }

      const updatedAtCell = row.getCell("updatedAt");
      if (updatedAtCell.value instanceof Date) {
        updatedAtCell.numFmt = "dd/mm/yyyy hh:mm:ss";
      }

      // Alineación para celdas específicas
      row.getCell("dni").alignment = { horizontal: "center" };
      row.getCell("situation").alignment = { horizontal: "center" };
      row.getCell("time").alignment = { horizontal: "center" };
      row.getCell("modality").alignment = { horizontal: "center" };
      row.getCell("status").alignment = { horizontal: "center" };
      row.getCell("age").alignment = { horizontal: "center" };
      row.getCell("gender").alignment = { horizontal: "center" };
      row.getCell("maritalStatus").alignment = { horizontal: "center" };
      row.getCell("previousApplications").alignment = { horizontal: "center" };
      row.getCell("hasDocument").alignment = { horizontal: "center" };
      row.getCell("hasPsychologicalReferral").alignment = { horizontal: "center" };
      row.getCell("satisfiedWithService").alignment = { horizontal: "left" };
      row.getCell("startedOnTime").alignment = { horizontal: "left" };
      row.getCell("respectfulTreatment").alignment = { horizontal: "left" };
    });

    // Aplicar bordes a todas las celdas con datos
    const dataRange = worksheet.getRows(1, filteredAppointments.length + 1);
    dataRange?.forEach((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Agregar filtros automáticos
    worksheet.autoFilter = {
      from: "A1",
      to: `AF${filteredAppointments.length + 1}`,
    };

    // Congelar la primera fila
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Generar el nombre del archivo
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

    let filename =
      options.filename || `citas_psicologicas_${dateStr}_${timeStr}.xlsx`;

    // Agregar información del rango de fechas al nombre si se especifica
    if (options.startDate || options.endDate) {
      const rangeInfo = [];
      if (options.startDate) rangeInfo.push(`desde_${options.startDate}`);
      if (options.endDate) rangeInfo.push(`hasta_${options.endDate}`);

      if (rangeInfo.length > 0) {
        filename = filename.replace(".xlsx", `_${rangeInfo.join("_")}.xlsx`);
      }
    }

    // Generar el buffer y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      recordsExported: filteredAppointments.length,
      totalRecords: appointments.length,
    };
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    throw new Error("Error al generar el archivo Excel");
  }
};

// Función auxiliar para obtener el nombre del estado
const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case "scheduled":
      return "Programada";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "no-show":
      return "No asistió";
    default:
      return "Desconocido";
  }
};

// Función para validar rango de fechas
export const validateDateRange = (
  startDate: string,
  endDate: string,
): string | null => {
  if (!startDate && !endDate) {
    return null; // No hay rango especificado, es válido
  }

  if (startDate && endDate && startDate > endDate) {
    return "La fecha de inicio no puede ser posterior a la fecha de fin";
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const maxDate = oneYearFromNow.toISOString().split("T")[0];

  if (endDate && endDate > maxDate) {
    return "La fecha de fin no puede ser más de un año en el futuro";
  }

  return null;
};

const getEducationLevelDisplayName = (level: string): string => {
  const levels = {
    quinto_secundaria: "Quinto año de Secundaria",
    egresado_secundaria: "Egresado de Secundaria Completa",
    estudiante_pregrado: "Estudiante de Pregrado Universitario",
    estudiante_instituto: "Estudiante de Instituto Técnico",
    egresado_universitario: "Egresado Universitario",
    profesional: "Profesional",
  };
  return levels[level as keyof typeof levels] || level;
};
