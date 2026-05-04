import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import type { Appointment, AppointmentsHookReturn } from "../types";
import toast from "react-hot-toast";
import { uploadPDFDocument } from "../utils/fileUpload";
import { isCompletionDataValid } from "../utils/appointmentValidation";
import { getAppointmentPermissions } from "../utils/appointmentPermissions";

// ─── Query keys ────────────────────────────────────────────────────────────────
export const APPOINTMENT_QUERY_KEYS = {
  all: ["appointments"] as const,
  byId: (id?: string) => ["appointments", id] as const,
};

// ─── Transiciones de estado válidas ───────────────────────────────────────────
const VALID_STATUS_TRANSITIONS: Record<
  Appointment["status"],
  Appointment["status"][]
> = {
  scheduled: ["completed", "cancelled", "no-show"],
  completed: [],
  cancelled: ["scheduled"],
  "no-show": ["scheduled"],
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  scheduled: "programada",
  completed: "completada",
  cancelled: "cancelada",
  "no-show": "no asistió",
};

const validateStatusTransition = (
  currentStatus: Appointment["status"],
  newStatus: Appointment["status"],
): boolean =>
  VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;

// ─── Fetchers ──────────────────────────────────────────────────────────────────
export const fetchAppointmentById = async (
  id?: string,
): Promise<Appointment | null> => {
  if (!id) return null;
  const docSnap = await getDoc(doc(db, "appointments", id));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Appointment)
    : null;
};

// ─── Hook standalone por ID ────────────────────────────────────────────────────
export const useAppointmentByIdQuery = (id?: string) =>
  useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.byId(id),
    queryFn: () => fetchAppointmentById(id),
    enabled: !!id,
  });

// ─── Hook principal ────────────────────────────────────────────────────────────
export const useAppointments = (): AppointmentsHookReturn => {
  const queryClient = useQueryClient();
  const { user, isAdmin, isCoordinator, isPsychologist } = useAuth();

  // Obtener todas las citas (filtradas por rol)
  const getAppointments = async (): Promise<Appointment[]> => {
    let appointmentsQuery;

    if (isPsychologist && user) {
      const psychologistSnapshot = await getDocs(
        query(collection(db, "psychologists"), where("userId", "==", user.id)),
      );

      if (psychologistSnapshot.empty) {
        return [];
      }

      const psychologistId = psychologistSnapshot.docs[0].id;
      appointmentsQuery = query(
        collection(db, "appointments"),
        where("psychologistId", "==", psychologistId),
      );
    } else {
      appointmentsQuery = collection(db, "appointments");
    }

    const snapshot = await getDocs(appointmentsQuery);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  };

  // Crear o actualizar cita
  const saveAppointment = async (
    data: Partial<Appointment>,
  ): Promise<Appointment> => {
    try {
      if (data.id) {
        const currentAppointment = await fetchAppointmentById(data.id);
        if (currentAppointment) {
          const permissions = getAppointmentPermissions(
            currentAppointment,
            user,
            isAdmin,
            isCoordinator,
            isPsychologist,
          );
          if (!permissions.canEdit && !permissions.canEditReason) {
            throw new Error("No tienes permisos para editar esta cita");
          }
        }

        await updateDoc(doc(db, "appointments", data.id), {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email ?? "system",
        });
        toast.success("Cita actualizada exitosamente");
        return { ...data, id: data.id } as Appointment;
      } else {
        if (!isAdmin && !isCoordinator) {
          throw new Error("No tienes permisos para crear citas");
        }

        const newRef = await addDoc(collection(db, "appointments"), {
          ...data,
          status: "scheduled",
          createdAt: new Date().toISOString(),
          createdBy: user?.email ?? "system",
        });
        return { ...data, id: newRef.id } as Appointment;
      }
    } catch (error) {
      console.error("Error al guardar cita:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar cita",
      );
      throw error;
    }
  };

  // Eliminar cita
  const deleteAppointment = async (id: string): Promise<string> => {
    try {
      const currentAppointment = await fetchAppointmentById(id);
      if (currentAppointment) {
        const permissions = getAppointmentPermissions(
          currentAppointment,
          user,
          isAdmin,
          isCoordinator,
          isPsychologist,
        );
        if (!permissions.canDelete) {
          throw new Error("No tienes permisos para eliminar esta cita");
        }
      }

      await deleteDoc(doc(db, "appointments", id));
      toast.success("Cita eliminada exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar cita",
      );
      throw error;
    }
  };

  // Actualizar estado de cita
  const updateAppointmentStatus = async (
    id: string,
    status: Appointment["status"],
    completionData?: Partial<Appointment>,
  ): Promise<string> => {
    if (!user) throw new Error("Usuario no autenticado");

    const currentAppointment = await fetchAppointmentById(id);
    if (!currentAppointment) throw new Error("Cita no encontrada");

    const permissions = getAppointmentPermissions(
      currentAppointment,
      user,
      isAdmin,
      isCoordinator,
      isPsychologist,
    );

    const permissionChecks: Partial<Record<Appointment["status"], boolean>> = {
      cancelled: permissions.canCancel,
      "no-show": permissions.canMarkNoShow,
      scheduled: permissions.canReschedule,
      completed: permissions.canComplete,
    };

    if (permissionChecks[status] === false) {
      const actionLabels: Record<Appointment["status"], string> = {
        cancelled: "cancelar citas",
        "no-show": "marcar citas como no asistió",
        scheduled: "reprogramar citas",
        completed: "completar citas",
      };
      throw new Error(`No tienes permisos para ${actionLabels[status]}`);
    }

    if (status === "completed") {
      if (!completionData || !isCompletionDataValid(completionData)) {
        throw new Error(
          "Todos los campos demográficos y académicos son requeridos para completar la cita",
        );
      }
    }

    if (!validateStatusTransition(currentAppointment.status, status)) {
      throw new Error(
        `No se puede cambiar de "${STATUS_LABELS[currentAppointment.status]}" a "${STATUS_LABELS[status]}"`,
      );
    }

    try {
      await updateDoc(doc(db, "appointments", id), {
        status,
        ...(status === "completed" && completionData ? completionData : {}),
        ...((status === "cancelled" || status === "no-show") &&
        completionData?.cancellationReason
          ? { cancellationReason: completionData.cancellationReason }
          : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: user.email ?? "system",
      });

      toast.success(`Cita ${STATUS_LABELS[status]} exitosamente`);
      return id;
    } catch (error) {
      console.error("Error al actualizar estado de la cita:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar estado de la cita",
      );
      throw error;
    }
  };

  // Subir documento PDF a una cita
  const uploadDocumentToAppointment = async (
    appointmentId: string,
    file: File,
  ): Promise<void> => {
    if (!user?.email) throw new Error("Usuario no autenticado");

    const currentAppointment = await fetchAppointmentById(appointmentId);
    if (currentAppointment) {
      const permissions = getAppointmentPermissions(
        currentAppointment,
        user,
        isAdmin,
        isCoordinator,
        isPsychologist,
      );
      if (!permissions.canView) {
        throw new Error(
          "No tienes permisos para gestionar documentos de esta cita",
        );
      }
      if (currentAppointment.status !== "completed") {
        throw new Error("Solo se pueden subir documentos a citas completadas");
      }
    }

    try {
      const documentInfo = await uploadPDFDocument(
        file,
        appointmentId,
        user.email,
      );

      await updateDoc(doc(db, "appointments", appointmentId), {
        document: documentInfo,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });

      toast.success("Documento subido exitosamente");
    } catch (error) {
      console.error("Error al subir documento:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al subir documento",
      );
      throw error;
    }
  };

  // Subir PDF de derivación psicológica a una cita (marca hasPsychologicalReferral: true)
  const uploadReferralDocumentToAppointment = async (
    appointmentId: string,
    file: File,
  ): Promise<void> => {
    if (!user?.email) throw new Error("Usuario no autenticado");

    const currentAppointment = await fetchAppointmentById(appointmentId);
    if (currentAppointment) {
      const permissions = getAppointmentPermissions(
        currentAppointment,
        user,
        isAdmin,
        isCoordinator,
        isPsychologist,
      );
      if (!permissions.canView) {
        throw new Error(
          "No tienes permisos para gestionar documentos de esta cita",
        );
      }
      if (currentAppointment.status !== "completed") {
        throw new Error(
          "Solo se pueden subir derivaciones a citas completadas",
        );
      }
    }

    try {
      const referralDocumentInfo = await uploadPDFDocument(
        file,
        `${appointmentId}_referral`,
        user.email,
      );

      await updateDoc(doc(db, "appointments", appointmentId), {
        referralDocument: referralDocumentInfo,
        hasPsychologicalReferral: true,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });

      toast.success("Derivación psicológica registrada exitosamente");
    } catch (error) {
      console.error("Error al subir derivación:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al subir derivación",
      );
      throw error;
    }
  };

  // Eliminar documento de la cita
  const deleteDocumentFromAppointment = async (
    appointmentId: string,
  ): Promise<void> => {
    if (!user?.email) throw new Error("Usuario no autenticado");

    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        document: null,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });
      toast.success("Documento eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar documento",
      );
      throw error;
    }
  };

  // Eliminar documento de derivación psicológica
  const deleteReferralDocumentFromAppointment = async (
    appointmentId: string,
  ): Promise<void> => {
    if (!user?.email) throw new Error("Usuario no autenticado");

    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        referralDocument: null,
        hasPsychologicalReferral: false,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });
      toast.success("Derivación eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar derivación:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar derivación",
      );
      throw error;
    }
  };

  // ─── React Query ────────────────────────────────────────────────────────────
  const appointmentsQuery = useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.all,
    queryFn: getAppointments,
  });

  const saveAppointmentMutation = useMutation({
    mutationFn: saveAppointment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all }),
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all }),
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      completionData,
    }: {
      id: string;
      status: Appointment["status"];
      completionData?: Partial<Appointment>;
    }) => updateAppointmentStatus(id, status, completionData),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all }),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({
      appointmentId,
      file,
    }: {
      appointmentId: string;
      file: File;
    }) => uploadDocumentToAppointment(appointmentId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all }),
  });

  const uploadReferralDocumentMutation = useMutation({
    mutationFn: ({
      appointmentId,
      file,
    }: {
      appointmentId: string;
      file: File;
    }) => uploadReferralDocumentToAppointment(appointmentId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all }),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      deleteDocumentFromAppointment(appointmentId),
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_QUERY_KEYS.byId(appointmentId),
      });
    },
  });

  const deleteReferralDocumentMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      deleteReferralDocumentFromAppointment(appointmentId),
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_QUERY_KEYS.byId(appointmentId),
      });
    },
  });

  // ─── Filtros (calculados desde caché) ─────────────────────────────────────
  const appointments = appointmentsQuery.data ?? [];

  const filterByPsychologist = (psychologistId: string): Appointment[] =>
    appointments.filter((a) => a.psychologistId === psychologistId);

  const filterByDateRange = (
    startDate: string,
    endDate: string,
  ): Appointment[] =>
    appointments.filter((a) => a.date >= startDate && a.date <= endDate);

  const filterByStatus = (status: Appointment["status"]): Appointment[] =>
    appointments.filter((a) => a.status === status);

  return {
    appointments,
    isLoading: appointmentsQuery.isLoading,
    isError: appointmentsQuery.isError,
    error: appointmentsQuery.error as Error | null,
    useAppointmentByIdQuery,
    saveAppointment: saveAppointmentMutation.mutate,
    deleteAppointment: deleteAppointmentMutation.mutate,
    updateAppointmentStatus: (
      id: string,
      status: Appointment["status"],
      completionData?: Partial<Appointment>,
    ) => updateAppointmentStatusMutation.mutate({ id, status, completionData }),
    uploadDocument: uploadDocumentMutation.mutate,
    uploadReferralDocument: uploadReferralDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    deleteReferralDocument: deleteReferralDocumentMutation.mutate,
    isSaving: saveAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
    isUpdatingStatus: updateAppointmentStatusMutation.isPending,
    isUploadingDocument: uploadDocumentMutation.isPending,
    isUploadingReferral: uploadReferralDocumentMutation.isPending,
    isDeletingDocument: deleteDocumentMutation.isPending,
    isDeletingReferral: deleteReferralDocumentMutation.isPending,
    filterByPsychologist,
    filterByDateRange,
    filterByStatus,
  };
};
