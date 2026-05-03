import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import type { Appointment } from "../types";

// Función para formatear la fecha en formato legible
const formatDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para convertir hora de formato 24h a 12h con AM/PM
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Función para obtener el estado en español
const getStatusInSpanish = (status: string): string => {
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

// Función para obtener la modalidad en español
const getModalityInSpanish = (modality: string): string => {
  return modality === "presential" ? "Presencial" : "Virtual";
};

// Función para obtener la situación en español
const getSituationInSpanish = (situation: string): string => {
  return situation === "ceprunsa" ? "Postulante CEPRUNSA" : "Particular";
};

// Función para obtener el nivel educativo en español
const getEducationLevelInSpanish = (level: string): string => {
  switch (level) {
    case "quinto_secundaria":
      return "Quinto año de Secundaria";
    case "egresado_secundaria":
      return "Egresado de Secundaria Completa";
    case "estudiante_pregrado":
      return "Estudiante de Pregrado Universitario";
    case "estudiante_instituto":
      return "Estudiante de Instituto Técnico";
    case "egresado_universitario":
      return "Egresado Universitario";
    case "profesional":
      return "Profesional";
    default:
      return "No especificado";
  }
};

// Función para obtener el género en español
const getGenderInSpanish = (gender: string): string => {
  switch (gender) {
    case "masculino":
      return "Masculino";
    case "femenino":
      return "Femenino";
    case "otro":
      return "Otro";
    default:
      return "No especificado";
  }
};

// Función para obtener el estado civil en español
const getMaritalStatusInSpanish = (status: string): string => {
  switch (status) {
    case "soltero":
      return "Soltero/a";
    case "casado":
      return "Casado/a";
    case "divorciado":
      return "Divorciado/a";
    case "viudo":
      return "Viudo/a";
    case "conviviente":
      return "Conviviente";
    default:
      return "No especificado";
  }
};

// Función principal para exportar la cita a Word
export const exportAppointmentToWord = async (
  appointment: Appointment,
  templateUrl = "/templates/appointment_template.docx"
): Promise<void> => {
  try {
    // Cargar la plantilla
    const response = await fetch(templateUrl);
    const templateContent = await response.arrayBuffer();

    // Preparar los datos para la plantilla
    const data = {
      // Información del cliente
      clientName: appointment.client.fullName,
      clientDni: appointment.client.dni,
      clientSituation: getSituationInSpanish(appointment.client.situation),
      clientPhone: appointment.client.phone,
      clientEmail: appointment.client.email,

      // Información de la cita
      appointmentId: appointment.id,
      appointmentDate: formatDate(appointment.date),
      appointmentTime: formatTime(appointment.time),
      appointmentStatus: getStatusInSpanish(appointment.status),
      appointmentModality: getModalityInSpanish(appointment.modality),
      appointmentLocation: appointment.location,

      // Información del proceso (si aplica)
      processName: appointment.processName || "No aplica",

      // Información del motivo y psicólogo
      reasonName: appointment.reasonName,
      psychologistName: appointment.psychologistName,

      // Información de cancelación (si aplica)
      cancellationReason: appointment.cancellationReason || "No aplica",

      // Metadatos
      createdAt: new Date(appointment.createdAt).toLocaleString(),
      createdBy: appointment.createdBy,
      updatedAt: appointment.updatedAt
        ? new Date(appointment.updatedAt).toLocaleString()
        : "No actualizado",
      updatedBy: appointment.updatedBy || "No actualizado",

      // Fecha de generación del documento
      generatedDate: new Date().toLocaleString(),

      // Información demográfica y académica
      age: appointment.age?.toString() || "No registrado",
      gender: appointment.gender
        ? getGenderInSpanish(appointment.gender)
        : "No registrado",
      birthPlace: appointment.birthPlace || "No registrado",
      birthDate: appointment.birthDate
        ? formatDate(appointment.birthDate)
        : "No registrado",
      currentResidence: appointment.currentResidence || "No registrado",
      maritalStatus: appointment.maritalStatus
        ? getMaritalStatusInSpanish(appointment.maritalStatus)
        : "No registrado",
      educationLevel: appointment.educationLevel
        ? getEducationLevelInSpanish(appointment.educationLevel)
        : "No registrado",
      currentApplication: appointment.currentApplication || "No registrado",
      previousApplications:
        appointment.previousApplications?.toString() || "No registrado",
      firstEvaluationDate: appointment.firstEvaluationDate
        ? formatDate(appointment.firstEvaluationDate)
        : "No registrado",
    };

    // Crear un nuevo objeto PizZip con el contenido de la plantilla
    const zip = new PizZip(templateContent);

    // Crear un nuevo objeto Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Renderizar el documento con los datos
    doc.render(data);

    // Generar el documento final
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Nombre del archivo
    const fileName = `Cita_${appointment.client.fullName.replace(
      /\s+/g,
      "_"
    )}_${appointment.date}.docx`;

    // Guardar el archivo
    saveAs(out, fileName);

    return Promise.resolve();
  } catch (error) {
    console.error("Error al exportar la cita a Word:", error);
    return Promise.reject(error);
  }
};

// Función para exportar la hoja de derivación psicológica a Word
export const exportDerivationToWord = async (
  appointment: Appointment,
  templateUrl = "/templates/appointment_derivation_template.docx"
): Promise<void> => {
  try {
    // Cargar la plantilla
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla de derivación: ${response.statusText}`);
    }
    const templateContent = await response.arrayBuffer();

    // Preparar los datos para la plantilla de derivación
    const data = {
      clientName: appointment.client.fullName,
      birthDate: appointment.birthDate
        ? formatDate(appointment.birthDate)
        : "No registrada",
      gender: appointment.gender
        ? getGenderInSpanish(appointment.gender)
        : "No registrado",
      phoneClient: appointment.client.phone,
      emailClient: appointment.client.email,
      psychologistName: appointment.psychologistName,
    };

    // Crear un nuevo objeto PizZip con el contenido de la plantilla
    const zip = new PizZip(templateContent);

    // Crear un nuevo objeto Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Renderizar el documento con los datos
    doc.render(data);

    // Generar el documento final
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Nombre del archivo
    const fileName = `Derivacion_${appointment.client.fullName.replace(
      /\s+/g,
      "_"
    )}_${appointment.date}.docx`;

    // Guardar el archivo
    saveAs(out, fileName);

    return Promise.resolve();
  } catch (error) {
    console.error("Error al exportar la hoja de derivación:", error);
    return Promise.reject(error);
  }
};
