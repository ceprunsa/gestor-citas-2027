import type { Appointment } from "../types";

export const isCompletionDataValid = (data: Partial<Appointment>): boolean => {
  const requiredFields = [
    "age",
    "gender",
    "birthPlace",
    "birthDate",
    "currentResidence",
    "maritalStatus",
    "educationLevel",
    "currentApplication",
    "previousApplications",
    "firstEvaluationDate",
  ];

  return requiredFields.every((field) => {
    const value = data[field as keyof Appointment];
    return value !== undefined && value !== null && value !== "";
  });
};

export const canCompleteAppointment = isCompletionDataValid;

export const getEducationLevelOptions = () => [
  { value: "quinto_secundaria", label: "Quinto año de Secundaria" },
  { value: "egresado_secundaria", label: "Egresado de Secundaria Completa" },
  {
    value: "estudiante_pregrado",
    label: "Estudiante de Pregrado Universitario",
  },
  { value: "estudiante_instituto", label: "Estudiante de Instituto Técnico" },
  { value: "egresado_universitario", label: "Egresado Universitario" },
  { value: "profesional", label: "Profesional" },
];

export const getMaritalStatusOptions = () => [
  { value: "soltero", label: "Soltero" },
  { value: "casado", label: "Casado" },
  /*{ value: "divorciado", label: "Divorciado" },
  { value: "viudo", label: "Viudo" },
  { value: "conviviente", label: "Conviviente" },*/
];

export const getGenderOptions = () => [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
];
