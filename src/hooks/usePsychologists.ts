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
import type { Psychologist, PsychologistsHookReturn } from "../types";
import toast from "react-hot-toast";

// ─── Query keys ────────────────────────────────────────────────────────────────
export const PSYCHOLOGIST_QUERY_KEYS = {
  all: ["psychologists"] as const,
  byId: (id?: string) => ["psychologists", id] as const,
};

// ─── Fetchers ──────────────────────────────────────────────────────────────────
export const fetchPsychologists = async (): Promise<Psychologist[]> => {
  const snapshot = await getDocs(collection(db, "psychologists"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Psychologist));
};

export const fetchPsychologistById = async (
  id?: string
): Promise<Psychologist | null> => {
  if (!id) return null;
  const docSnap = await getDoc(doc(db, "psychologists", id));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Psychologist)
    : null;
};

// ─── Hook standalone por ID ────────────────────────────────────────────────────
export const usePsychologistByIdQuery = (id?: string) =>
  useQuery({
    queryKey: PSYCHOLOGIST_QUERY_KEYS.byId(id),
    queryFn: () => fetchPsychologistById(id),
    enabled: !!id,
  });

// ─── Hook principal ────────────────────────────────────────────────────────────
export const usePsychologists = (): PsychologistsHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Crear o actualizar psicólogo
  const savePsychologist = async (
    data: Partial<Psychologist>
  ): Promise<Psychologist> => {
    try {
      if (data.id) {
        await updateDoc(doc(db, "psychologists", data.id), {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email ?? "system",
        });
        toast.success("Psicólogo actualizado exitosamente");
        return { ...data, id: data.id } as Psychologist;
      } else {
        const newRef = await addDoc(collection(db, "psychologists"), {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: user?.email ?? "system",
        });
        toast.success("Psicólogo creado exitosamente");
        return { ...data, id: newRef.id } as Psychologist;
      }
    } catch (error) {
      console.error("Error al guardar psicólogo:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar psicólogo"
      );
      throw error;
    }
  };

  // Eliminar psicólogo
  const deletePsychologist = async (id: string): Promise<string> => {
    try {
      await deleteDoc(doc(db, "psychologists", id));
      toast.success("Psicólogo eliminado exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar psicólogo:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar psicólogo"
      );
      throw error;
    }
  };

  // ─── React Query ────────────────────────────────────────────────────────────
  const psychologistsQuery = useQuery({
    queryKey: PSYCHOLOGIST_QUERY_KEYS.all,
    queryFn: fetchPsychologists,
  });

  const savePsychologistMutation = useMutation({
    mutationFn: savePsychologist,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PSYCHOLOGIST_QUERY_KEYS.all }),
  });

  const deletePsychologistMutation = useMutation({
    mutationFn: deletePsychologist,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PSYCHOLOGIST_QUERY_KEYS.all }),
  });

  return {
    psychologists: psychologistsQuery.data ?? [],
    isLoading: psychologistsQuery.isLoading,
    isError: psychologistsQuery.isError,
    error: psychologistsQuery.error as Error | null,
    usePsychologistByIdQuery,
    savePsychologist: savePsychologistMutation.mutate,
    deletePsychologist: deletePsychologistMutation.mutate,
    isSaving: savePsychologistMutation.isPending,
    isDeleting: deletePsychologistMutation.isPending,
  };
};
