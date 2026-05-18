"use client";

import {
  useState,
  useEffect,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppointments } from "../hooks/useAppointments";
import { usePsychologists } from "../hooks/usePsychologists";
import { useProcesses } from "../hooks/useProcesses";
import { useConsultationReasons } from "../hooks/useConsultationReasons";
import { useAuth } from "../hooks/useAuth";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Info,
  FileText,
  CheckCircle,
  BookmarkCheck,
  Eye,
  Edit,
  FileCheck,
  Share2,
} from "lucide-react";
import type { Appointment } from "../types";
import toast from "react-hot-toast";
import { ExportModal } from "../components/ExportModal";
import { FileSpreadsheet } from "lucide-react";
import { AppointmentActionsMenu } from "../components/AppointmentActionsMenu";
import { AppointmentStatusBadge } from "../components/AppointmentStatusBadge";
import {
  getAppointmentPermissions,
  canUserViewAppointment,
} from "../utils/appointmentPermissions";
import React from "react";

const Appointments = () => {
  const navigate = useNavigate();
  const {
    appointments,
    isLoading,
    deleteAppointment,
    updateAppointmentStatus,
    saveAppointment,
  } = useAppointments();
  const { psychologists, isLoading: isLoadingPsychologists } =
    usePsychologists();
  const { processes, isLoading: isLoadingProcesses } = useProcesses();
  const { reasons, isLoading: isLoadingReasons } = useConsultationReasons();
  const { user, isAdmin, isCoordinator, isPsychologist } = useAuth();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPsychologist, setSelectedPsychologist] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para modales de confirmación
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);
  const [appointmentForSurvey, setAppointmentForSurvey] =
    useState<Appointment | null>(null);
  const [surveyData, setSurveyData] = useState({
    satisfiedWithService: null as boolean | null,
    startedOnTime: null as boolean | null,
    respectfulTreatment: null as boolean | null,
  });
  const [appointmentForReason, setAppointmentForReason] =
    useState<Appointment | null>(null);
  const [cancellationReasonOption, setCancellationReasonOption] = useState("");
  const [cancellationReasonOther, setCancellationReasonOther] = useState("");
  // Estado para modal de exportación
  const [showExportModal, setShowExportModal] = useState(false);

  // Debugging

  const userFilteredAppointments = appointments.filter(() =>
    canUserViewAppointment(user, isAdmin, isCoordinator, isPsychologist),
  );

  // Filtrar citas
  const allFilteredAppointments = userFilteredAppointments
    .filter((appointment) => {
      // Filtro por término de búsqueda (nombre del cliente o DNI)
      if (
        searchTerm &&
        !appointment.client.fullName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !appointment.client.dni.includes(searchTerm)
      ) {
        return false;
      }

      // Filtro por psicólogo
      if (
        selectedPsychologist &&
        appointment.psychologistId !== selectedPsychologist
      ) {
        return false;
      }

      // Filtro por proceso
      if (selectedProcess && appointment.processId !== selectedProcess) {
        return false;
      }

      // Filtro por motivo
      if (selectedReason && appointment.reasonId !== selectedReason) {
        return false;
      }

      // Filtro por estado
      if (selectedStatus && appointment.status !== selectedStatus) {
        return false;
      }

      // Filtro por fecha
      if (selectedDate && appointment.date !== selectedDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenar por fecha (más reciente primero) y luego por hora
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return a.time.localeCompare(b.time);
    });

  // Calcular paginación
  const totalItems = allFilteredAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredAppointments = allFilteredAppointments.slice(
    startIndex,
    endIndex,
  );

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedPsychologist,
    selectedProcess,
    selectedReason,
    selectedStatus,
    selectedDate,
  ]);

  const handleDeleteClick = (appointment: Appointment) => {
    const permissions = getAppointmentPermissions(
      appointment,
      user,
      isAdmin,
      isCoordinator,
      isPsychologist,
    );
    if (!permissions.canDelete) {
      toast.error("No tienes permisos para eliminar citas");
      return;
    }
    setAppointmentToDelete(appointment);
  };

  const handleStatusChange = (
    appointment: Appointment,
    newStatus: Appointment["status"],
  ) => {
    const permissions = getAppointmentPermissions(
      appointment,
      user,
      isAdmin,
      isCoordinator,
      isPsychologist,
    );

    if (newStatus === "cancelled" && !permissions.canCancel) {
      toast.error("No tienes permisos para cancelar citas");
      return;
    }

    if (newStatus === "no-show" && !permissions.canMarkNoShow) {
      toast.error("No tienes permisos para marcar citas como no asistió");
      return;
    }

    if (newStatus === "scheduled" && !permissions.canReschedule) {
      toast.error("No tienes permisos para reprogramar citas");
      return;
    }

    confirmChangeStatus(appointment, newStatus);
  };

  const handleCompleteClick = (appointment: Appointment) => {
    console.log("Completing appointment:", appointment);
    const permissions = getAppointmentPermissions(
      appointment,
      user,
      isAdmin,
      isCoordinator,
      isPsychologist,
    );
    if (!permissions.canComplete) {
      toast.error("No tienes permisos para completar citas");
      return;
    }
    navigate("/appointments/" + appointment.id + "/complete");
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete || !appointmentToDelete.id) return;

    try {
      await deleteAppointment(appointmentToDelete.id);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error("Error al eliminar cita:", error);
    }
  };

  const confirmChangeStatus = async (
    appointment: Appointment,
    newStatus: Appointment["status"],
  ) => {
    try {
      await updateAppointmentStatus(appointment.id, newStatus);
    } catch (error) {
      console.error("Error al cambiar estado de la cita:", error);
    }
  };

  const handleSurveyClick = (appointment: Appointment) => {
    setAppointmentForSurvey(appointment);
    setSurveyData({
      satisfiedWithService:
        appointment.satisfactionSurvey?.satisfiedWithService ?? null,
      startedOnTime: appointment.satisfactionSurvey?.startedOnTime ?? null,
      respectfulTreatment:
        appointment.satisfactionSurvey?.respectfulTreatment ?? null,
    });
  };

  const handleSaveSurvey = async () => {
    if (!appointmentForSurvey) return;
    if (
      surveyData.satisfiedWithService === null ||
      surveyData.startedOnTime === null ||
      surveyData.respectfulTreatment === null
    ) {
      toast.error("Por favor, responda todas las preguntas.");
      return;
    }
    try {
      await saveAppointment({
        id: appointmentForSurvey.id,
        satisfactionSurvey: {
          satisfiedWithService: surveyData.satisfiedWithService,
          startedOnTime: surveyData.startedOnTime,
          respectfulTreatment: surveyData.respectfulTreatment,
        },
      });
      setAppointmentForSurvey(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReasonClick = (appointment: Appointment) => {
    setAppointmentForReason(appointment);
    const existingReason = appointment.cancellationReason || "";
    const predefinedOptions = [
      "Olvido de la cita.",
      "Cruce de horarios.",
      "Problemas de conexión u otros inconvenientes técnicos.",
      "Falta de interés.",
    ];

    if (predefinedOptions.includes(existingReason)) {
      setCancellationReasonOption(existingReason);
      setCancellationReasonOther("");
    } else if (existingReason) {
      setCancellationReasonOption("Otros (especificar).");
      setCancellationReasonOther(existingReason);
    } else {
      setCancellationReasonOption("");
      setCancellationReasonOther("");
    }
  };

  const handleSaveReason = async () => {
    if (!appointmentForReason) return;

    const finalReason =
      cancellationReasonOption === "Otros (especificar)."
        ? cancellationReasonOther.trim()
        : cancellationReasonOption;

    try {
      await saveAppointment({
        id: appointmentForReason.id,
        cancellationReason: finalReason,
      });
      setAppointmentForReason(null);
    } catch (e) {
      console.error(e);
    }
  };

  const cancelDelete = () => {
    setAppointmentToDelete(null);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedPsychologist) count++;
    if (selectedProcess) count++;
    if (selectedReason) count++;
    if (selectedStatus) count++;
    if (selectedDate) count++;
    return count;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (
    isLoading ||
    isLoadingPsychologists ||
    isLoadingProcesses ||
    isLoadingReasons
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay citas y el usuario es psicólogo, mostrar un mensaje específico
  if (isPsychologist && userFilteredAppointments.length === 0) {
    return (
      <div className="w-full max-w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Mis Citas Psicológicas
            </h1>
            <p className="text-gray-600">Gestión de citas asignadas</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <AlertCircle size={32} className="text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            No tienes citas asignadas
          </h2>
          <p className="text-gray-600 mb-4">
            Actualmente no tienes citas psicológicas asignadas. Las citas que te
            sean asignadas aparecerán aquí.
          </p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, por favor contacta al coordinador o
            administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {isPsychologist ? "Mis Citas Psicológicas" : "Citas Psicológicas"}
          </h1>
          <p className="text-gray-600">
            {isPsychologist
              ? "Gestión de citas asignadas"
              : "Gestión de citas del consultorio psicológico"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary inline-flex items-center"
          >
            <Filter size={18} className="mr-1 md:mr-2" />
            <span>{showFilters ? "Ocultar filtros" : "Mostrar filtros"}</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-success inline-flex items-center"
          >
            <FileSpreadsheet size={18} className="mr-1 md:mr-2" />
            <span>Exportar Excel</span>
          </button>
          {(isAdmin || isCoordinator) && (
            <Link
              to="/appointments/new"
              className="btn btn-primary inline-flex items-center"
            >
              <Plus size={18} className="mr-1 md:mr-2" />
              <span>Nueva Cita</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <select
              className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="scheduled">Programadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no-show">No asistieron</option>
            </select>
          </div>
        </div>

        {/* Filtros adicionales */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {!isPsychologist && (
              <div>
                <label
                  htmlFor="psychologist"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Psicólogo
                </label>
                <select
                  id="psychologist"
                  className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedPsychologist}
                  onChange={(e) => setSelectedPsychologist(e.target.value)}
                >
                  <option value="">Todos los psicólogos</option>
                  {psychologists.map((psychologist) => (
                    <option key={psychologist.id} value={psychologist.id}>
                      {psychologist.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label
                htmlFor="process"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Proceso
              </label>
              <select
                id="process"
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
              >
                <option value="">Todos los procesos</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motivo de consulta
              </label>
              <select
                id="reason"
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                <option value="">Todos los motivos</option>
                {reasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje informativo */}
      {(isAdmin || isCoordinator || isPsychologist) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Permisos por rol:</strong>{" "}
                {isAdmin &&
                  "Como administrador, puedes realizar todas las acciones en las citas."}
                {isCoordinator &&
                  !isAdmin &&
                  "Como coordinador, puedes gestionar citas pero no eliminarlas."}
                {isPsychologist &&
                  !isCoordinator &&
                  !isAdmin &&
                  "Como psicólogo, solo puedes completar y marcar como no asistió tus propias citas asignadas."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de citas */}
      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-visible">
        {allFilteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gray-100 p-3">
                <Search size={24} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No se encontraron citas
            </h3>
            <p className="text-gray-500">
              No se encontraron citas con los filtros seleccionados
            </p>
          </div>
        ) : (
          <>
            {/* Información de paginación y selector de elementos por página */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)}{" "}
                  de {totalItems} resultados
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="itemsPerPage"
                    className="text-sm text-gray-700"
                  >
                    Mostrar:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="text-sm border border-gray-300 rounded pl-2 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navegación de páginas */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {getPageNumbers().map(
                    (
                      page:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<unknown>
                          >
                        | Iterable<ReactNode>
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<unknown>
                              >
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined,
                      index: Key | null | undefined,
                    ) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof page === "number" && handlePageChange(page)
                        }
                        disabled={page === "..."}
                        className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                          page === currentPage
                            ? "bg-blue-600 text-white border-blue-600"
                            : page === "..."
                              ? "cursor-default"
                              : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>

            {/* Cabeceras de tabla - Solo en desktop */}
            <div className="hidden lg:block bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Cliente</div>
                <div className="col-span-2">Fecha y Hora</div>
                {!isPsychologist && <div className="col-span-2">Psicólogo</div>}
                <div className={`col-span-${isPsychologist ? "3" : "2"}`}>
                  Motivo de Consulta
                </div>
                <div className="col-span-1">Estado</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 lg:px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="lg:col-span-3">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {appointment.client.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        DNI: {appointment.client.dni}
                      </div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {appointment.client.situation === "ceprunsa"
                          ? "CEPRUNSA"
                          : "Particular"}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {new Date(
                          appointment.date + "T00:00:00",
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.time}
                      </div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {appointment.modality === "presential"
                          ? "Presencial"
                          : "Virtual"}
                      </div>
                    </div>
                  </div>

                  {!isPsychologist && (
                    <div className="lg:col-span-2">
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {appointment.psychologistName}
                      </div>
                    </div>
                  )}

                  <div className={`lg:col-span-${isPsychologist ? "3" : "2"}`}>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900 leading-tight">
                        {appointment.reasonName}
                      </div>
                      {appointment.processName && (
                        <div className="text-xs text-gray-500">
                          Proceso: {appointment.processName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                      <AppointmentStatusBadge
                        status={appointment.status}
                        size="sm"
                      />
                      {appointment.status === "completed" &&
                        (isAdmin || isCoordinator) && (
                          <span
                            className={`inline-flex border items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${appointment.satisfactionSurvey ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}
                          >
                            {appointment.satisfactionSurvey ? (
                              <FileCheck size={12} className="mr-1" />
                            ) : (
                              <AlertCircle size={12} className="mr-1" />
                            )}
                            {appointment.satisfactionSurvey
                              ? "Con encuesta"
                              : "Sin encuesta"}
                          </span>
                        )}
                      {(appointment.status === "cancelled" ||
                        appointment.status === "no-show") && (
                        <span
                          className={`inline-flex border items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${appointment.cancellationReason ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}
                        >
                          {appointment.cancellationReason ? (
                            <BookmarkCheck size={12} className="mr-1" />
                          ) : (
                            <AlertCircle size={12} className="mr-1" />
                          )}
                          {appointment.cancellationReason
                            ? "Justificada"
                            : "No justificada"}
                        </span>
                      )}
                      {appointment.document && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                          <FileText size={12} className="mr-1" />
                          PDF
                        </span>
                      )}
                      {appointment.status === "completed" &&
                        appointment.hasPsychologicalReferral && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200 w-fit">
                            <Share2 size={12} className="mr-1" />
                            Derivación
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex justify-start lg:justify-center">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const permissions = getAppointmentPermissions(
                          appointment,
                          user,
                          isAdmin,
                          isCoordinator,
                          isPsychologist,
                        );
                        return (
                          <React.Fragment>
                            {permissions.canView && (
                              <Link
                                to={`/appointments/${appointment.id}`}
                                className="inline-flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors shadow-sm"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </Link>
                            )}
                            {permissions.canComplete && (
                              <button
                                onClick={() => handleCompleteClick(appointment)}
                                className="inline-flex items-center justify-center w-8 h-8 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors shadow-sm"
                                title="Completar cita"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </React.Fragment>
                        );
                      })()}

                      <AppointmentActionsMenu
                        appointment={appointment}
                        user={user}
                        isAdmin={isAdmin}
                        isCoordinator={isCoordinator}
                        isPsychologist={isPsychologist}
                        onDelete={handleDeleteClick}
                        onChangeStatus={handleStatusChange}
                        onSurvey={handleSurveyClick}
                        onReason={handleReasonClick}
                        showPrimaryActions={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación inferior */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-center">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {getPageNumbers().map(
                    (
                      page:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<unknown>
                          >
                        | Iterable<ReactNode>
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<unknown>
                              >
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined,
                      index: Key | null | undefined,
                    ) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof page === "number" && handlePageChange(page)
                        }
                        disabled={page === "..."}
                        className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                          page === currentPage
                            ? "bg-blue-600 text-white border-blue-600"
                            : page === "..."
                              ? "cursor-default"
                              : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de eliminación */}
      {appointmentToDelete && (
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
                        ¿Estás seguro de que deseas eliminar la cita de{" "}
                        <strong>{appointmentToDelete.client.fullName}</strong>?
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-danger sm:ml-3"
                  onClick={confirmDelete}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={cancelDelete}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encuesta */}
      {appointmentForSurvey && (
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
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Encuesta de Satisfacción
                    </h3>
                    <div className="mt-4 space-y-4 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          ¿Se siente satisfecho con el servicio brindado? *
                        </p>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="satisfiedWithServiceModal"
                              checked={surveyData.satisfiedWithService === true}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  satisfiedWithService: true,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Sí
                            </span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="satisfiedWithServiceModal"
                              checked={surveyData.satisfiedWithService === false}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  satisfiedWithService: false,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              No
                            </span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          ¿La atención inició a la hora programada? *
                        </p>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="startedOnTimeModal"
                              checked={surveyData.startedOnTime === true}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  startedOnTime: true,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Sí
                            </span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="startedOnTimeModal"
                              checked={surveyData.startedOnTime === false}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  startedOnTime: false,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              No
                            </span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          ¿El trato del profesional fue amable y respetuoso? *
                        </p>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="respectfulTreatmentModal"
                              checked={surveyData.respectfulTreatment === true}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  respectfulTreatment: true,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Sí
                            </span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="respectfulTreatmentModal"
                              checked={surveyData.respectfulTreatment === false}
                              onChange={() =>
                                setSurveyData((p) => ({
                                  ...p,
                                  respectfulTreatment: false,
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              No
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-primary sm:ml-3"
                  onClick={handleSaveSurvey}
                >
                  Guardar Encuesta
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={() => setAppointmentForSurvey(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motivo/Razón */}
      {appointmentForReason && (
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Edit className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Motivo / Razón
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-3">
                        Especifique la razón de la{" "}
                        {appointmentForReason.status === "cancelled"
                          ? "cancelación"
                          : "inasistencia"}{" "}
                        de{" "}
                        <strong>{appointmentForReason.client.fullName}</strong>.
                      </p>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        value={cancellationReasonOption}
                        onChange={(e) =>
                          setCancellationReasonOption(e.target.value)
                        }
                      >
                        <option value="">Seleccione una razón...</option>
                        <option value="Olvido de la cita.">
                          Olvido de la cita.
                        </option>
                        <option value="Cruce de horarios.">
                          Cruce de horarios.
                        </option>
                        <option value="Problemas de conexión u otros inconvenientes técnicos.">
                          Problemas de conexión u otros inconvenientes técnicos.
                        </option>
                        <option value="Falta de interés.">
                          Falta de interés.
                        </option>
                        <option value="Otros (especificar).">
                          Otros (especificar).
                        </option>
                      </select>
                      {cancellationReasonOption === "Otros (especificar)." && (
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Especifique el motivo..."
                          value={cancellationReasonOther}
                          onChange={(e) =>
                            setCancellationReasonOther(e.target.value)
                          }
                        ></textarea>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-primary sm:ml-3 disabled:opacity-50"
                  onClick={handleSaveReason}
                  disabled={
                    !cancellationReasonOption ||
                    (cancellationReasonOption === "Otros (especificar)." &&
                      cancellationReasonOther.trim().length === 0)
                  }
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={() => setAppointmentForReason(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exportación */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          appointments={allFilteredAppointments}
          currentFiltersCount={getActiveFiltersCount()}
        />
      )}
    </div>
  );
};

export default Appointments;
