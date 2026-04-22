import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppointments, useAppointmentByIdQuery } from "../hooks/useAppointments";
import { useAuth } from "../hooks/useAuth";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  LinkIcon,
  FileText,
  Edit,
  Trash2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Clipboard,
  Tag,
  Info,
  Upload,
  CheckCircle,
} from "lucide-react";
import type { Appointment } from "../types";
import toast from "react-hot-toast";
import DocumentUpload from "../components/DocumentUpload";
import { exportAppointmentToWord } from "../utils/docxExport";

const AppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    deleteAppointment,
    updateAppointmentStatus,
    uploadDocument,
    isUploadingDocument,
  } = useAppointments();
  const { isAdmin, isCoordinator } = useAuth();

  const { data: appointment, isLoading, isError } = useAppointmentByIdQuery(id);

  // Estados para modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<{
    show: boolean;
    status: Appointment["status"] | null;
  }>({ show: false, status: null });
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Estado para indicar si se está exportando a Word
  const [isExporting, setIsExporting] = useState(false);

  // Manejar eliminación de cita
  const handleDelete = async () => {
    if (!isAdmin && !isCoordinator) {
      toast.error("No tienes permisos para eliminar citas");
      return;
    }

    if (!id) return;

    try {
      await deleteAppointment(id);
      navigate("/appointments");
    } catch (error) {
      console.error("Error al eliminar cita:", error);
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = async (status: Appointment["status"]) => {
    if (!isAdmin) {
      toast.error(
        "Solo los administradores pueden cambiar el estado de las citas"
      );
      return;
    }

    if (!id) return;

    try {
      await updateAppointmentStatus(id, status);
      setShowStatusModal({ show: false, status: null });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // Manejar subida de documento
  const handleDocumentUpload = (appointmentId: string, file: File) => {
    // Verificar que la cita esté completada antes de subir documento
    if (appointment?.status !== "completed") {
      toast.error("Solo se pueden subir documentos a citas completadas");
      return;
    }
    uploadDocument({ appointmentId, file });
  };

  // Manejar exportación a Word
  const handleExportToWord = async () => {
    if (!appointment) return;

    // Verificar que la cita esté completada
    if (appointment.status !== "completed") {
      toast.error("Solo se pueden exportar citas completadas");
      return;
    }

    setIsExporting(true);
    try {
      await exportAppointmentToWord(appointment);
      toast.success("Documento exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar documento:", error);
      toast.error("Error al exportar documento");
    } finally {
      setIsExporting(false);
    }
  };

  // Funciones auxiliares
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      case "no-show":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusDisplayName = (status: string) => {
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

  const getEducationLevelDisplay = (level: string) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudo cargar la información de la cita.
        </span>
        <div className="mt-4">
          <Link
            to="/appointments"
            className="inline-flex items-center text-red-700 hover:text-red-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista de citas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado con botones de acción */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/appointments"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalles de la Cita
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              Información completa de la cita psicológica
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Botón para subir documento (solo para citas completadas) */}
            {appointment.status === "completed" && (
              <button
                onClick={() => setShowDocumentModal(true)}
                className="btn btn-secondary inline-flex items-center"
              >
                <Upload size={18} className="mr-2" />
                <span>
                  {appointment.document
                    ? "Gestionar Documento"
                    : "Subir Documento"}
                </span>
              </button>
            )}

            {/* Botón para exportar a Word (solo para citas completadas) */}
            {appointment.status === "completed" && (
              <button
                onClick={handleExportToWord}
                disabled={isExporting}
                className="btn btn-secondary inline-flex items-center"
              >
                <FileText size={18} className="mr-2" />
                <span>{isExporting ? "Exportando..." : "Exportar a Word"}</span>
              </button>
            )}

            {appointment?.status === "scheduled" && (
              <>
                {(isAdmin || isCoordinator) && (
                  <Link
                    to={`/appointments/${id}/edit`}
                    className="btn btn-secondary inline-flex items-center"
                  >
                    <Edit size={18} className="mr-2" />
                    <span>Editar</span>
                  </Link>
                )}
                {isAdmin && (
                  <button
                    onClick={() =>
                      setShowStatusModal({ show: true, status: "cancelled" })
                    }
                    className="btn btn-danger inline-flex items-center"
                  >
                    <XCircle size={18} className="mr-2" />
                    <span>Cancelar Cita</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() =>
                      setShowStatusModal({ show: true, status: "no-show" })
                    }
                    className="btn btn-warning inline-flex items-center"
                  >
                    <AlertCircle size={18} className="mr-2" />
                    <span>No Asistió</span>
                  </button>
                )}
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger inline-flex items-center"
              >
                <Trash2 size={18} className="mr-2" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta principal con información de la cita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Información del cliente */}
        <div className="lg:col-span-2">
          {/* Tarjeta de estado */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-700 font-medium">
                  {new Date(
                    appointment.date + "T00:00:00"
                  ).toLocaleDateString()}{" "}
                  - {appointment.time}
                </span>
              </div>
              <div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClasses(
                    appointment.status
                  )}`}
                >
                  {getStatusDisplayName(appointment.status)}
                </span>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
                  <User className="h-5 w-5 text-primary mr-2" />
                  Información del Cliente
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Nombres y Apellidos</p>
                    <p className="font-medium text-gray-900">
                      {appointment.client.fullName}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">DNI</p>
                    <p className="font-medium text-gray-900">
                      {appointment.client.dni}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Situación</p>
                    <p className="font-medium text-gray-900">
                      {appointment.client.situation === "ceprunsa"
                        ? "Postulante CEPRUNSA"
                        : "Particular"}
                    </p>
                  </div>
                  {appointment.client.situation === "ceprunsa" &&
                    appointment.processName && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">
                          Proceso CEPRUNSA
                        </p>
                        <p className="font-medium text-gray-900">
                          {appointment.processName}
                        </p>
                      </div>
                    )}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Teléfono de contacto
                      </p>
                      <p className="font-medium text-gray-900">
                        {appointment.client.phone}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Correo electrónico
                      </p>
                      <p className="font-medium text-gray-900">
                        {appointment.client.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de la cita */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
                  <Clipboard className="h-5 w-5 text-primary mr-2" />
                  Detalles de la Cita
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Motivo de consulta</p>
                    <p className="font-medium text-gray-900">
                      {appointment.reasonName}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    <User className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Psicólogo asignado
                      </p>
                      <p className="font-medium text-gray-900">
                        {appointment.psychologistName}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          appointment.date + "T00:00:00"
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="font-medium text-gray-900">
                        {appointment.time}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Modalidad</p>
                    <p className="font-medium text-gray-900">
                      {appointment.modality === "presential"
                        ? "Presencial"
                        : "Virtual"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
                    {appointment.modality === "presential" ? (
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    ) : (
                      <LinkIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm text-gray-500">
                        {appointment.modality === "presential"
                          ? "Dirección"
                          : "Enlace de reunión"}
                      </p>
                      {appointment.modality === "presential" ? (
                        <p className="font-medium text-gray-900">
                          {appointment.location}
                        </p>
                      ) : (
                        <a
                          href={appointment.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {appointment.location}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Resultados y estado */}
        <div className="lg:col-span-1">
          {/* Tarjeta de estado */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="h-5 w-5 text-primary mr-2" />
                Estado de la Cita
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    appointment.status === "scheduled"
                      ? "bg-blue-100"
                      : appointment.status === "completed"
                      ? "bg-green-100"
                      : appointment.status === "cancelled"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {appointment.status === "scheduled" ? (
                    <Calendar className="h-10 w-10 text-blue-600" />
                  ) : appointment.status === "completed" ? (
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  ) : appointment.status === "cancelled" ? (
                    <XCircle className="h-10 w-10 text-red-600" />
                  ) : (
                    <AlertCircle className="h-10 w-10 text-yellow-600" />
                  )}
                </div>
              </div>
              <div className="text-center mb-4">
                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeClasses(
                    appointment.status
                  )}`}
                >
                  {getStatusDisplayName(appointment.status)}
                </span>
              </div>
              <div className="text-center text-gray-600">
                <p>
                  Última actualización:{" "}
                  {appointment.updatedAt
                    ? new Date(appointment.updatedAt).toLocaleString()
                    : new Date(appointment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Resultados de la cita (solo si está completada) */}
          {appointment?.status === "completed" && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 mb-6">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  Información Demográfica y Académica
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Edad
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.age
                        ? `${appointment.age} años`
                        : "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Sexo
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.gender
                        ? appointment.gender.charAt(0).toUpperCase() +
                          appointment.gender.slice(1)
                        : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Lugar de Nacimiento
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.birthPlace || "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.birthDate
                        ? new Date(
                            appointment.birthDate + "T00:00:00"
                          ).toLocaleDateString()
                        : "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Residencia Actual
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.currentResidence || "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Estado Civil
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.maritalStatus
                        ? appointment.maritalStatus.charAt(0).toUpperCase() +
                          appointment.maritalStatus.slice(1)
                        : "No registrado"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Grado de Instrucción
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.educationLevel
                        ? getEducationLevelDisplay(appointment.educationLevel)
                        : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Postulación Actual
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.currentApplication || "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Postulaciones Previas
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.previousApplications !== undefined
                        ? appointment.previousApplications
                        : "No registrado"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Fecha de la 1era Evaluación
                    </p>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                      {appointment.firstEvaluationDate
                        ? new Date(
                            appointment.firstEvaluationDate + "T00:00:00"
                          ).toLocaleDateString()
                        : "No registrada"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documento asociado (solo si está completada) */}
          {appointment.status === "completed" && appointment.document && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 mb-6">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  Documento Asociado
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-900 break-words hyphens-auto leading-relaxed"
                      title={appointment.document.originalName}
                    >
                      {appointment.document.originalName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Subido el{" "}
                      {new Date(
                        appointment.document.uploadedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <a
                      href={appointment.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-md transition-colors duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver documento
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información para citas no completadas */}
          {appointment.status !== "completed" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Importante:</strong> Los documentos PDF y la
                    exportación a Word estarán disponibles una vez que la cita
                    sea completada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Motivo de cancelación (solo si está cancelada) */}
          {appointment?.status === "cancelled" &&
            appointment.cancellationReason && (
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 mb-6">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Info className="h-5 w-5 text-primary mr-2" />
                    Motivo de Cancelación
                  </h2>
                </div>
                <div className="p-6">
                  <p className="bg-gray-50 p-3 rounded-md text-gray-900">
                    {appointment.cancellationReason}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modal de gestión de documentos (solo para citas completadas) */}
      {showDocumentModal && appointment.status === "completed" && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Gestionar Documento de la Cita
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Sube un documento PDF que se asociará permanentemente a
                        esta cita completada.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <DocumentUpload
                    appointmentId={appointment.id}
                    currentDocument={appointment.document}
                    onUpload={handleDocumentUpload}
                    isUploading={isUploadingDocument}
                    disabled={appointment.status !== "completed"}
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={() => setShowDocumentModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Eliminar cita
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar esta cita? Esta
                        acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-danger sm:ml-3"
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de estado */}
      {showStatusModal.show && showStatusModal.status && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    {showStatusModal.status === "cancelled" ? (
                      <XCircle className="h-6 w-6 text-red-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      {showStatusModal.status === "cancelled"
                        ? "Cancelar cita"
                        : "Marcar como no asistió"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas{" "}
                        {showStatusModal.status === "cancelled"
                          ? "cancelar esta cita"
                          : "marcar esta cita como no asistió"}
                        ?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`btn ${
                    showStatusModal.status === "cancelled"
                      ? "btn-danger"
                      : "btn-warning"
                  } sm:ml-3`}
                  onClick={() =>
                    showStatusModal.status &&
                    handleStatusChange(showStatusModal.status)
                  }
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={() =>
                    setShowStatusModal({ show: false, status: null })
                  }
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
