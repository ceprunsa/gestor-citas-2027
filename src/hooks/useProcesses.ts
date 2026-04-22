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
import type { Process, ProcessesHookReturn } from "../types";
import toast from "react-hot-toast";

// ─── Query keys ────────────────────────────────────────────────────────────────
export const PROCESS_QUERY_KEYS = {
  all: ["processes"] as const,
  byId: (id?: string) => ["processes", id] as const,
};

// ─── Fetchers ──────────────────────────────────────────────────────────────────
export const fetchProcesses = async (): Promise<Process[]> => {
  const snapshot = await getDocs(collection(db, "processes"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Process));
};

export const fetchProcessById = async (id?: string): Promise<Process | null> => {
  if (!id) return null;
  const docSnap = await getDoc(doc(db, "processes", id));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Process)
    : null;
};

// ─── Hook standalone por ID ────────────────────────────────────────────────────
export const useProcessByIdQuery = (id?: string) =>
  useQuery({
    queryKey: PROCESS_QUERY_KEYS.byId(id),
    queryFn: () => fetchProcessById(id),
    enabled: !!id,
  });

// ─── Hook principal ────────────────────────────────────────────────────────────
export const useProcesses = (): ProcessesHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Crear o actualizar proceso
  const saveProcess = async (data: Partial<Process>): Promise<Process> => {
    try {
      if (data.id) {
        await updateDoc(doc(db, "processes", data.id), {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email ?? "system",
        });
        toast.success("Proceso actualizado exitosamente");
        return { ...data, id: data.id } as Process;
      } else {
        const newRef = await addDoc(collection(db, "processes"), {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: user?.email ?? "system",
        });
        toast.success("Proceso creado exitosamente");
        return { ...data, id: newRef.id } as Process;
      }
    } catch (error) {
      console.error("Error al guardar proceso:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar proceso"
      );
      throw error;
    }
  };

  // Eliminar proceso
  const deleteProcess = async (id: string): Promise<string> => {
    try {
      await deleteDoc(doc(db, "processes", id));
      toast.success("Proceso eliminado exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar proceso:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar proceso"
      );
      throw error;
    }
  };

  // Cambiar estado de proceso (activo/inactivo)
  const toggleProcessStatus = async (
    id: string,
    isActive: boolean
  ): Promise<string> => {
    try {
      await updateDoc(doc(db, "processes", id), {
        isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email ?? "system",
      });
      toast.success(
        `Proceso ${isActive ? "activado" : "desactivado"} exitosamente`
      );
      return id;
    } catch (error) {
      console.error("Error al cambiar estado del proceso:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cambiar estado del proceso"
      );
      throw error;
    }
  };

  // ─── React Query ────────────────────────────────────────────────────────────
  const processesQuery = useQuery({
    queryKey: PROCESS_QUERY_KEYS.all,
    queryFn: fetchProcesses,
  });

  const saveProcessMutation = useMutation({
    mutationFn: saveProcess,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROCESS_QUERY_KEYS.all }),
  });

  const deleteProcessMutation = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROCESS_QUERY_KEYS.all }),
  });

  const toggleProcessStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProcessStatus(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROCESS_QUERY_KEYS.all }),
  });

  return {
    processes: processesQuery.data ?? [],
    isLoading: processesQuery.isLoading,
    isError: processesQuery.isError,
    error: processesQuery.error as Error | null,
    useProcessByIdQuery,
    saveProcess: saveProcessMutation.mutate,
    deleteProcess: deleteProcessMutation.mutate,
    toggleProcessStatus: (id: string, isActive: boolean) =>
      toggleProcessStatusMutation.mutate({ id, isActive }),
    isSaving: saveProcessMutation.isPending,
    isDeleting: deleteProcessMutation.isPending,
    isToggling: toggleProcessStatusMutation.isPending,
  };
};
