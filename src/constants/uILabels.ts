/**
 * Constantes para etiquetas de la interfaz de usuario
 * Esto permite mantener una separación entre los nombres de los campos en la base de datos
 * y cómo se muestran en la interfaz de usuario
 */

export const APPOINTMENT_LABELS = {
  // Campos demográficos
  AGE: "Edad",
  GENDER: "Sexo",
  BIRTH_PLACE: "Lugar de Nacimiento",
  BIRTH_DATE: "Fecha de Nacimiento",
  CURRENT_RESIDENCE: "Lugar de Residencia Actual",
  MARITAL_STATUS: "Estado Civil",
  EDUCATION_LEVEL: "Grado de Instrucción",
  CURRENT_APPLICATION: "Postulación Actual",
  PREVIOUS_APPLICATIONS: "Número de Postulaciones Previas",
  FIRST_EVALUATION_DATE: "Fecha de la 1era Evaluación",

  // Mensajes por defecto
  NO_AGE: "No registrado",
  NO_GENDER: "No registrado",
  NO_BIRTH_PLACE: "No registrado",
  NO_BIRTH_DATE: "No registrada",
  NO_CURRENT_RESIDENCE: "No registrado",
  NO_MARITAL_STATUS: "No registrado",
  NO_EDUCATION_LEVEL: "No registrado",
  NO_CURRENT_APPLICATION: "No registrada",
  NO_PREVIOUS_APPLICATIONS: "No registrado",
  NO_FIRST_EVALUATION_DATE: "No registrada",

  // Placeholders para formularios
  AGE_PLACEHOLDER: "Ingrese la edad del paciente",
  GENDER_PLACEHOLDER: "Seleccione el sexo del paciente",
  BIRTH_PLACE_PLACEHOLDER: "Ingrese el lugar de nacimiento",
  BIRTH_DATE_PLACEHOLDER: "Seleccione la fecha de nacimiento",
  CURRENT_RESIDENCE_PLACEHOLDER: "Ingrese el lugar de residencia actual",
  MARITAL_STATUS_PLACEHOLDER: "Seleccione el estado civil",
  EDUCATION_LEVEL_PLACEHOLDER: "Seleccione el grado de instrucción",
  CURRENT_APPLICATION_PLACEHOLDER:
    "Ingrese la carrera de postulación (ej: Medicina)",
  PREVIOUS_APPLICATIONS_PLACEHOLDER:
    "Ingrese el número de postulaciones previas",
  FIRST_EVALUATION_DATE_PLACEHOLDER:
    "Seleccione la fecha de la primera evaluación",

  // Opciones para campos de selección
  GENDER_OPTIONS: {
    masculino: "Masculino",
    femenino: "Femenino",
    otro: "Otro",
  },
  MARITAL_STATUS_OPTIONS: {
    soltero: "Soltero(a)",
    casado: "Casado(a)",
    divorciado: "Divorciado(a)",
    viudo: "Viudo(a)",
    conviviente: "Conviviente",
  },
  EDUCATION_LEVEL_OPTIONS: {
    quinto_secundaria: "Quinto año de Secundaria",
    egresado_secundaria: "Egresado de Secundaria Completa",
    estudiante_pregrado: "Estudiante de Pregrado Universitario",
    estudiante_instituto: "Estudiante de Instituto Técnico",
    egresado_universitario: "Egresado Universitario",
    profesional: "Profesional",
  },
};

// Otros grupos de etiquetas pueden agregarse aquí en el futuro
