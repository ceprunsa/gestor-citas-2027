"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  Edit,
  XCircle,
  AlertCircle,
  Trash2,
  Calendar,
  FileCheck,
} from "lucide-react";
import { getAppointmentPermissions } from "../utils/appointmentPermissions";
import type { Appointment, User } from "../types";

interface AppointmentActionsMenuProps {
  appointment: Appointment;
  user: User | null;
  isAdmin: boolean;
  isCoordinator: boolean;
  isPsychologist: boolean;
  onDelete: (appointment: Appointment) => void;
  onChangeStatus: (
    appointment: Appointment,
    newStatus: Appointment["status"],
  ) => void;
  onSurvey?: (appointment: Appointment) => void;
  onReason?: (appointment: Appointment) => void;
  showPrimaryActions?: boolean;
}

export const AppointmentActionsMenu = ({
  appointment,
  user,
  isAdmin,
  isCoordinator,
  isPsychologist,
  onDelete,
  onChangeStatus,
  onSurvey,
  onReason,
  showPrimaryActions = true,
}: AppointmentActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<"right" | "left">("right");
  const [verticalPosition, setVerticalPosition] = useState<"down" | "up">(
    "down",
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calcular posición del menú
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = 250; // Increased estimated menu height for better calculation

      // Si no hay espacio a la derecha, abrir hacia la izquierda
      if (buttonRect.right + menuWidth > viewportWidth - 16) {
        setMenuPosition("left");
      } else {
        setMenuPosition("right");
      }

      // Si no hay espacio hacia abajo, abrir hacia arriba
      if (buttonRect.bottom + menuHeight > viewportHeight - 32) {
        setVerticalPosition("up");
      } else {
        setVerticalPosition("down");
      }
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const permissions = getAppointmentPermissions(
    appointment,
    user,
    isAdmin,
    isCoordinator,
    isPsychologist,
  );

  // Acciones principales que se muestran como botones
  const primaryActions = [];

  // Ver siempre es acción principal si tiene permisos
  /*if (permissions.canView) {
    primaryActions.push(
      <Link
        key="view"
        to={`/appointments/${appointment.id}`}
        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        title="Ver detalles"
      >
        <Eye size={14} />
      </Link>,
    );
  }*/

  // Editar si está disponible
  if (permissions.canEdit) {
    primaryActions.push(
      <Link
        key="edit"
        to={`/appointments/${appointment.id}/edit`}
        className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 hover:text-yellow-800 transition-colors"
        title="Editar cita"
      >
        <Edit size={14} />
      </Link>,
    );
  }

  // Acciones secundarias para el menú
  const hasSecondaryActions =
    (!showPrimaryActions && permissions.canView) ||
    (!showPrimaryActions && permissions.canEdit) ||
    permissions.canMarkNoShow ||
    permissions.canCancel ||
    permissions.canReschedule ||
    permissions.canDelete ||
    (appointment.status === "completed" &&
      (isAdmin || isCoordinator) &&
      onSurvey) ||
    ((appointment.status === "cancelled" || appointment.status === "no-show") &&
      onReason);

  return (
    <div className="flex items-center gap-1">
      {/* Acciones principales */}
      {showPrimaryActions && (
        <div className="flex items-center gap-1">{primaryActions}</div>
      )}

      {/* Menú de acciones secundarias */}
      {hasSecondaryActions && (
        <div className="relative" ref={menuRef}>
          <button
            ref={buttonRef}
            onClick={handleToggleMenu}
            className="inline-flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Más acciones"
          >
            <MoreVertical size={14} />
          </button>

          {/* Menú desplegable */}
          {isOpen && (
            <>
              {/* Overlay para móvil */}
              <div
                className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden"
                onClick={() => setIsOpen(false)}
              />

              {/* Menú */}
              <div
                className={`absolute z-[60] w-52 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${
                  verticalPosition === "up"
                    ? "bottom-full mb-1"
                    : "top-full mt-1"
                } ${menuPosition === "left" ? "right-0" : "left-0"} 
                sm:${menuPosition === "left" ? "right-0" : "left-0"}
                max-sm:fixed max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:${
                  verticalPosition === "up" ? "bottom-16" : "bottom-4"
                }`}
                style={{
                  position: window.innerWidth >= 640 ? "absolute" : "fixed",
                  zIndex: 60,
                }}
              >
                <div className="py-1">
                  {/* Título en móvil */}
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-100 sm:hidden">
                    Acciones para {appointment.client.fullName}
                  </div>

                  {/* Ver detalles (Si está oculto en primaryActions) */}
                  {/*!showPrimaryActions && permissions.canView && (
                    <Link
                      to={`/appointments/${appointment.id}`}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Eye size={14} className="mr-2 text-blue-500" />
                      Ver detalles
                    </Link>
                  )*/}

                  {/* Editar cita (Si está oculto en primaryActions) */}
                  {!showPrimaryActions && permissions.canEdit && (
                    <Link
                      to={`/appointments/${appointment.id}/edit`}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Edit size={14} className="mr-2 text-yellow-500" />
                      Editar cita
                    </Link>
                  )}

                  {/* Reprogramar */}
                  {permissions.canReschedule && (
                    <button
                      onClick={() =>
                        handleAction(() =>
                          onChangeStatus(appointment, "scheduled"),
                        )
                      }
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                    >
                      <Calendar size={14} className="mr-2 text-green-500" />
                      Reprogramar
                    </button>
                  )}

                  {/* Encuesta de Satisfacción */}
                  {appointment.status === "completed" &&
                    (isAdmin || isCoordinator) &&
                    onSurvey && (
                      <button
                        onClick={() =>
                          handleAction(() => onSurvey(appointment))
                        }
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                      >
                        <FileCheck size={14} className="mr-2 text-purple-500" />
                        Encuesta de satisfacción
                      </button>
                    )}

                  {/* Ver/Editar Motivo de Cancelación */}
                  {(appointment.status === "cancelled" ||
                    appointment.status === "no-show") &&
                    onReason && (
                      <button
                        onClick={() =>
                          handleAction(() => onReason(appointment))
                        }
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        <Edit size={14} className="mr-2 text-blue-500" />
                        Motivo / Razón
                      </button>
                    )}

                  {/* No asistió */}
                  {permissions.canMarkNoShow && (
                    <button
                      onClick={() =>
                        handleAction(() =>
                          onChangeStatus(appointment, "no-show"),
                        )
                      }
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-800 transition-colors"
                    >
                      <AlertCircle size={14} className="mr-2 text-yellow-500" />
                      No asistió
                    </button>
                  )}

                  {/* Cancelar */}
                  {permissions.canCancel && (
                    <button
                      onClick={() =>
                        handleAction(() =>
                          onChangeStatus(appointment, "cancelled"),
                        )
                      }
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-800 transition-colors"
                    >
                      <XCircle size={14} className="mr-2 text-red-500" />
                      Cancelar
                    </button>
                  )}

                  {/* Separador si hay acciones peligrosas */}
                  {permissions.canDelete &&
                    (permissions.canMarkNoShow ||
                      permissions.canCancel ||
                      permissions.canReschedule) && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}

                  {/* Eliminar */}
                  {permissions.canDelete && (
                    <button
                      onClick={() => handleAction(() => onDelete(appointment))}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={14} className="mr-2 text-red-500" />
                      Eliminar
                    </button>
                  )}

                  {/* Botón cerrar en móvil */}
                  <div className="border-t border-gray-100 mt-1 sm:hidden">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
