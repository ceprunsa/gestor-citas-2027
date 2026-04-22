import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import type { User, UsersHookReturn } from "../types";
import toast from "react-hot-toast";

// ─── Query keys ────────────────────────────────────────────────────────────────
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  byId: (id?: string) => ["users", id] as const,
};

// ─── Fetchers (reutilizables fuera del hook si se necesita) ────────────────────
export const fetchUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
};

export const fetchUserById = async (id?: string): Promise<User | null> => {
  if (!id) return null;
  const docSnap = await getDoc(doc(db, "users", id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as User) : null;
};

// ─── Hook standalone para obtener un usuario por ID ───────────────────────────
export const useUserByIdQuery = (id?: string) =>
  useQuery({
    queryKey: USER_QUERY_KEYS.byId(id),
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });

// ─── Hook principal ────────────────────────────────────────────────────────────
export const useUsers = (): UsersHookReturn => {
  const queryClient = useQueryClient();
  const { createUser } = useAuth();

  // Crear o actualizar usuario
  const saveUser = async (userData: Partial<User>): Promise<Partial<User>> => {
    if (!userData.email) {
      throw new Error("El correo electrónico es requerido");
    }

    const validatedUserData: Partial<User> = {
      ...userData,
      role: userData.role as "admin" | "coordinator" | "psychologist" | "user",
    };

    try {
      await createUser(validatedUserData);
      toast.success(`Usuario ${userData.email} creado exitosamente`);
      return validatedUserData;
    } catch (error) {
      console.error("Error en saveUser:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear usuario"
      );
      throw error;
    }
  };

  // Actualizar rol de usuario
  const updateUserRole = async ({
    userId,
    newRole,
  }: {
    userId: string;
    newRole: "admin" | "coordinator" | "psychologist" | "user";
  }): Promise<void> => {
    const roleLabels: Record<typeof newRole, string> = {
      admin: "Administrador",
      coordinator: "Coordinador",
      psychologist: "Psicólogo",
      user: "Usuario",
    };

    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Rol actualizado exitosamente a ${roleLabels[newRole]}`);
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar rol"
      );
      throw error;
    }
  };

  // Eliminar usuario
  const deleteUser = async (id: string): Promise<string> => {
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Usuario eliminado exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar usuario"
      );
      throw error;
    }
  };

  // ─── React Query ────────────────────────────────────────────────────────────
  const usersQuery = useQuery({
    queryKey: USER_QUERY_KEYS.all,
    queryFn: fetchUsers,
  });

  const saveUserMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all }),
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error as Error | null,
    useUserByIdQuery,
    saveUser: saveUserMutation.mutate,
    updateUserRole: updateRoleMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isSaving: saveUserMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};
