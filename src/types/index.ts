import type { UseQueryResult } from "@tanstack/react-query";

// ─── Tipos base ────────────────────────────────────────────────────────────────

// Tipos de usuario
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  role: "admin" | "coordinator" | "psychologist" | "user";
  createdAt?: string;
  createdBy?: string;
}

// Tipos para el contexto de autenticación
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isPsychologist: boolean;
  loginWithGoogle: () => Promise<unknown>;
  logout: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<boolean>;
}

// Psicólogo
export interface Psychologist {
  id: string;
  fullName: string;
  dni: string;
  institutionalEmail: string;
  personalEmail: string;
  phone: string;
  userId?: string; // Referencia al usuario en caso de que tenga acceso al sistema
  createdAt: string;
  createdBy: string;
}

// Proceso CEPRUNSA
export interface Process {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// Motivo de consulta
export interface ConsultationReason {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// Cliente/Paciente (se incluye en la cita)
export interface Client {
  fullName: string;
  dni: string;
  situation: "ceprunsa" | "particular";
  phone: string;
  email: string;
}

// Documento asociado a la cita
export interface AppointmentDocument {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Cita psicológica
export interface Appointment {
  id: string;
  client: Client;
  processId?: string;
  processName?: string;
  reasonId: string;
  reasonName: string;
  /**
   * Fecha de la cita en formato YYYY-MM-DD (ISO 8601)
   * Se guarda en UTC para evitar problemas de zona horaria
   */
  date: string;
  /**
   * Hora de la cita en formato HH:MM (24h)
   */
  time: string;
  modality: "presential" | "virtual";
  location: string;
  psychologistId: string;
  psychologistName: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  /**
   * Edad del paciente
   */
  age?: number;
  /**
   * Sexo del paciente
   */
  gender?: "masculino" | "femenino" | "otro";
  /**
   * Lugar de nacimiento del paciente
   */
  birthPlace?: string;
  /**
   * Fecha de nacimiento del paciente en formato YYYY-MM-DD
   */
  birthDate?: string;
  /**
   * Lugar de residencia actual del paciente
   */
  currentResidence?: string;
  /**
   * Estado civil del paciente
   */
  maritalStatus?: "soltero" | "casado" | "divorciado" | "viudo" | "conviviente";
  /**
   * Grado de instrucción del paciente
   */
  educationLevel?:
    | "quinto_secundaria"
    | "egresado_secundaria"
    | "estudiante_pregrado"
    | "estudiante_instituto"
    | "egresado_universitario"
    | "profesional";
  /**
   * Carrera de postulación actual
   */
  currentApplication?: string;
  /**
   * Número de postulaciones previas
   */
  previousApplications?: number;
  /**
   * Fecha de la primera evaluación en formato YYYY-MM-DD
   */
  firstEvaluationDate?: string;
  cancellationReason?: string;
  /**
   * Documento PDF subido manualmente por el usuario
   */
  document?: AppointmentDocument;
  /**
   * Indica si la cita tiene una derivación psicológica asociada.
   * Se activa al subir el PDF firmado de derivación.
   */
  hasPsychologicalReferral?: boolean;
  /**
   * Documento PDF de derivación psicológica firmado
   */
  referralDocument?: AppointmentDocument;
  /**
   * Fecha y hora de creación en formato ISO 8601 completo
   */
  createdAt: string;
  createdBy: string;
  /**
   * Fecha y hora de última actualización en formato ISO 8601 completo
   */
  updatedAt?: string;
  updatedBy?: string;
  /**
   * Encuesta de satisfacción para citas completadas (solo admin/coordinator)
   */
  satisfactionSurvey?: {
    startedOnTime: boolean;
    respectfulTreatment: boolean;
  };
}

// ─── Tipos de retorno de hooks ─────────────────────────────────────────────────

// Hooks para usuarios
export interface UsersHookReturn {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  useUserByIdQuery: (id?: string) => UseQueryResult<User | null>;
  saveUser: (userData: Partial<User>) => void;
  updateUserRole: (args: {
    userId: string;
    newRole: "admin" | "coordinator" | "psychologist" | "user";
  }) => void;
  deleteUser: (id: string) => void;
  isSaving: boolean;
  isUpdatingRole: boolean;
  isDeleting: boolean;
}

// Hooks para psicólogos
export interface PsychologistsHookReturn {
  psychologists: Psychologist[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  usePsychologistByIdQuery: (
    id?: string,
  ) => UseQueryResult<Psychologist | null>;
  savePsychologist: (data: Partial<Psychologist>) => void;
  deletePsychologist: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}

// Hooks para procesos
export interface ProcessesHookReturn {
  processes: Process[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  useProcessByIdQuery: (id?: string) => UseQueryResult<Process | null>;
  saveProcess: (data: Partial<Process>) => void;
  deleteProcess: (id: string) => void;
  toggleProcessStatus: (id: string, isActive: boolean) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isToggling: boolean;
}

// Hooks para motivos de consulta
export interface ConsultationReasonsHookReturn {
  reasons: ConsultationReason[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  useConsultationReasonByIdQuery: (
    id?: string,
  ) => UseQueryResult<ConsultationReason | null>;
  saveReason: (data: Partial<ConsultationReason>) => void;
  deleteReason: (id: string) => void;
  toggleReasonStatus: (id: string, isActive: boolean) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isToggling: boolean;
}

// Hooks para citas
export interface AppointmentsHookReturn {
  appointments: Appointment[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  useAppointmentByIdQuery: (id?: string) => UseQueryResult<Appointment | null>;
  saveAppointment: (data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  updateAppointmentStatus: (
    id: string,
    status: Appointment["status"],
    data?: Partial<Appointment>,
  ) => void;
  uploadDocument: (data: { appointmentId: string; file: File }) => void;
  uploadReferralDocument: (data: { appointmentId: string; file: File }) => void;
  deleteDocument: (appointmentId: string) => void;
  deleteReferralDocument: (appointmentId: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  isUploadingDocument: boolean;
  isUploadingReferral: boolean;
  isDeletingDocument: boolean;
  isDeletingReferral: boolean;
  // Filtros
  filterByPsychologist: (psychologistId: string) => Appointment[];
  filterByDateRange: (startDate: string, endDate: string) => Appointment[];
  filterByStatus: (status: Appointment["status"]) => Appointment[];
}
