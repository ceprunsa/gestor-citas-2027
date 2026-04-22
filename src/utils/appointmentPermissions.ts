import type { Appointment, User } from "../types";

export interface AppointmentPermissions {
  canView: boolean;
  canEdit: boolean;
  canEditReason: boolean;
  canDelete: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canMarkNoShow: boolean;
  canReschedule: boolean;
}

export const getAppointmentPermissions = (
  appointment: Appointment,
  user: User | null,
  isAdmin: boolean,
  isCoordinator: boolean,
  isPsychologist: boolean,
): AppointmentPermissions => {
  if (!user) {
    return {
      canView: false,
      canEdit: false,
      canEditReason: false,
      canDelete: false,
      canComplete: false,
      canCancel: false,
      canMarkNoShow: false,
      canReschedule: false,
    };
  }

  if (isAdmin) {
    // Administradores pueden hacer todo
    return {
      canView: true,
      canEdit: appointment.status === "scheduled",
      canEditReason: true, // Edit reason is allowed
      canDelete: true,
      canComplete: appointment.status === "scheduled",
      canCancel: appointment.status === "scheduled",
      canMarkNoShow: appointment.status === "scheduled",
      canReschedule:
        appointment.status === "cancelled" || appointment.status === "no-show",
    };
  }

  if (isCoordinator) {
    // Coordinadores pueden hacer todo excepto eliminar
    return {
      canView: true,
      canEdit: appointment.status === "scheduled",
      canEditReason: true, // Edit reason is allowed
      canDelete: false, // Coordinadores no pueden eliminar
      canComplete: appointment.status === "scheduled",
      canCancel: appointment.status === "scheduled",
      canMarkNoShow: appointment.status === "scheduled",
      canReschedule:
        appointment.status === "cancelled" || appointment.status === "no-show",
    };
  }

  if (isPsychologist) {
    // Psicólogos solo pueden completar, marcar no asistió y ver detalles de sus propias citas
    return {
      canView: true,
      canEdit: false, // Psicólogos no pueden editar
      canEditReason: false, // Edit reason is not allowed
      canDelete: false, // Psicólogos no pueden eliminar
      canComplete: appointment.status === "scheduled",
      canCancel: false, // Psicólogos no pueden cancelar
      canMarkNoShow: appointment.status === "scheduled",
      canReschedule: false, // Psicólogos no pueden reprogramar
    };
  }

  // Sin permisos para otros roles o citas que no les pertenecen
  return {
    canView: false,
    canEdit: false,
    canEditReason: false, // Edit reason is not allowed
    canDelete: false,
    canComplete: false,
    canCancel: false,
    canMarkNoShow: false,
    canReschedule: false,
  };
};

export const canUserViewAppointment = (
  user: User | null,
  isAdmin: boolean,
  isCoordinator: boolean,
  isPsychologist: boolean,
): boolean => {
  if (!user) return false;

  // Administradores y coordinadores pueden ver todas las citas
  if (isAdmin || isCoordinator) return true;

  // Psicólogos solo pueden ver sus propias citas
  if (isPsychologist) {
    return true;
  }

  return false;
};
