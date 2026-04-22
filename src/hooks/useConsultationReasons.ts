import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import type {
  ConsultationReason,
  ConsultationReasonsHookReturn,
} from "../types";
import toast from "react-hot-toast";

// ─── Query keys ────────────────────────────────────────────────────────────────
export const REASON_QUERY_KEYS = {
  all: ["consultation_reasons"] as const,
  byId: (id?: string) => ["consultation_reasons", id] as const,
};

// ─── Fetchers ──────────────────────────────────────────────────────────────────
export const fetchConsultationReasons = async (): Promise<
  ConsultationReason[]
> => {
  const snapshot = await getDocs(collection(db, "consultation_reasons"));
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as ConsultationReason)
  );
};

export const fetchConsultationReasonById = async (
  id?: string
): Promise<ConsultationReason | null> => {
  if (!id) return null;
  const docSnap = await getDoc(doc(db, "consultation_reasons", id));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as ConsultationReason)
    : null;
};

// ─── Hook standalone por ID ────────────────────────────────────────────────────
export const useConsultationReasonByIdQuery = (id?: string) =>
  useQuery({
    queryKey: REASON_QUERY_KEYS.byId(id),
    queryFn: () => fetchConsultationReasonById(id),
    enabled: !!id,
  });

// ─── Hook principal ────────────────────────────────────────────────────────────
export const useConsultationReasons = (): ConsultationReasonsHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Crear o actualizar motivo de consulta
  const saveReason = async (
    data: Partial<ConsultationReason>
  ): Promise<ConsultationReason> => {
    try {
      if (data.id) {
        await updateDoc(doc(db, "consultation_reasons", data.id), {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email ?? "system",
        });
        toast.success("Motivo de consulta actualizado exitosamente");
        return { ...data, id: data.id } as ConsultationReason;
      } else {
        const newRef = await addDoc(collection(db, "consultation_reasons"), {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: user?.email ?? "system",
        });
        toast.success("Motivo de consulta creado exitosamente");
        return { ...data, id: newRef.id } as ConsultationReason;
      }
    } catch (error) {
      console.error("Error al guardar motivo de consulta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar motivo de consulta"
      );
      throw error;
    }
  };

  // Eliminar motivo de consulta
  const deleteReason = async (id: string): Promise<string> => {
    try {
      await deleteDoc(doc(db, "consultation_reasons", id));
      toast.success("Motivo de consulta eliminado exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar motivo de consulta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar motivo de consulta"
      );
      throw error;
    }
  };

  // Cambiar estado de motivo de consulta (activo/inactivo)
  const toggleReasonStatus = async (
    id: string,
    isActive: boolean
  ): Promise<string> => {
    try {
      await updateDoc(doc(db, "consultation_reasons", id), {
        isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email ?? "system",
      });
      toast.success(
        `Motivo de consulta ${isActive ? "activado" : "desactivado"} exitosamente`
      );
      return id;
    } catch (error) {
      console.error("Error al cambiar estado del motivo de consulta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cambiar estado del motivo de consulta"
      );
      throw error;
    }
  };

  // ─── React Query ────────────────────────────────────────────────────────────
  const reasonsQuery = useQuery({
    queryKey: REASON_QUERY_KEYS.all,
    queryFn: fetchConsultationReasons,
  });

  const saveReasonMutation = useMutation({
    mutationFn: saveReason,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: REASON_QUERY_KEYS.all }),
  });

  const deleteReasonMutation = useMutation({
    mutationFn: deleteReason,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: REASON_QUERY_KEYS.all }),
  });

  const toggleReasonStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleReasonStatus(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: REASON_QUERY_KEYS.all }),
  });

  return {
    reasons: reasonsQuery.data ?? [],
    isLoading: reasonsQuery.isLoading,
    isError: reasonsQuery.isError,
    error: reasonsQuery.error as Error | null,
    useConsultationReasonByIdQuery,
    saveReason: saveReasonMutation.mutate,
    deleteReason: deleteReasonMutation.mutate,
    toggleReasonStatus: (id: string, isActive: boolean) =>
      toggleReasonStatusMutation.mutate({ id, isActive }),
    isSaving: saveReasonMutation.isPending,
    isDeleting: deleteReasonMutation.isPending,
    isToggling: toggleReasonStatusMutation.isPending,
  };
};
