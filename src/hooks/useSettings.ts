import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface SystemSettings {
  general: {
    centerName: string;
    centerEmail: string;
    centerPhone: string;
    centerAddress: string;
  };
  appointments: {
    defaultDuration: string;
    minTimeAdvance: string;
    maxAppointmentsPerDay: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: string[];
  };
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const SETTINGS_QUERY_KEY = ["settings", "systemConfig"] as const;

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    centerName: "Consultorio Psicológico CEPRUNSA",
    centerEmail: "consultorio.psicologico@ceprunsa.edu.pe",
    centerPhone: "054-123456",
    centerAddress: "Local CEPRUNSA",
  },
  appointments: {
    defaultDuration: "60",
    minTimeAdvance: "24",
    maxAppointmentsPerDay: "8",
    workingHoursStart: "08:00",
    workingHoursEnd: "18:00",
    workingDays: ["1", "2", "3", "4", "5"], // Lunes a viernes
  },
};

// ─── Fetcher ───────────────────────────────────────────────────────────────────
const fetchSettings = async (): Promise<SystemSettings> => {
  const settingsRef = doc(db, "settings", "systemConfig");
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data() as SystemSettings;
  }

  // Inicializar con valores por defecto si no existe el documento
  await setDoc(settingsRef, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings): Promise<SystemSettings> => {
      await setDoc(doc(db, "settings", "systemConfig"), newSettings);
      return newSettings;
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, savedSettings);
      toast.success("Configuración guardada exitosamente");
    },
    onError: (error) => {
      console.error("Error al guardar la configuración:", error);
      toast.error("Error al guardar la configuración del sistema");
    },
  });

  return {
    settings: settingsQuery.data ?? null,
    saveSettings: saveSettingsMutation.mutateAsync,
    isLoading: settingsQuery.isLoading,
    isSaving: saveSettingsMutation.isPending,
    isError: settingsQuery.isError,
    error: settingsQuery.error as Error | null,
  };
};

export default useSettings;
