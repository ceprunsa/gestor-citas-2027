"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointments } from "../hooks/useAppointments";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Save, AlertCircle, ChevronDown, Check } from "lucide-react";
import type { Appointment } from "../types";
import toast from "react-hot-toast";
import {
  canCompleteAppointment,
  getEducationLevelOptions,
  getMaritalStatusOptions,
  getGenderOptions,
} from "../utils/appointmentValidation";

const AppointmentComplete = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, updateAppointmentStatus, isLoading } =
    useAppointments();
  const { isAdmin, isPsychologist, isCoordinator } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    birthPlace: "",
    birthDate: "",
    currentResidence: "",
    maritalStatus: "",
    educationLevel: "",
    currentApplication: "",
    previousApplications: "",
    firstEvaluationDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCareerDropdown, setShowCareerDropdown] = useState(false);
  const [careerSearchTerm, setCareerSearchTerm] = useState("");

  const careerOptions = [
    "Ingeniería Agronómica",
    "Biologia",
    "Ciencias de la Nutrición",
    "Ingeniería Pesquera",
    "Enfermeria",
    "Medicina",
    "Arquitectura",
    "Física",
    "Matemáticas",
    "Química",
    "Ingeniería Geológica",
    "Ingeniería Geofísica",
    "Ingeniería de Minas",
    "Ingeniería Civil",
    "Ingeniería Sanitaria",
    "Ingeniería Metalúrgica",
    "Ingeniería Química",
    "Ingeniería de Industrias Alimentarias",
    "Ingeniería de Materiales",
    "Ingeniería Ambiental",
    "Ingeniería Electrónica",
    "Ingeniería Industrial",
    "Ingeniería Mecánica",
    "Ingeniería Eléctrica",
    "Ingeniería de Sistemas",
    "Ciencias de la Computación",
    "Ingeniería de Telecomunicaciones",
    "Administración",
    "Marketing",
    "Banca y Seguros",
    "Gestión con Mención en Gestión Pública",
    "Gestión con Mención en Gestión de Empresas",
    "Gestión con Mención en Gestión de Proyectos",
    "Contabilidad",
    "Finanzas",
    "Educación con Especialidad de Ciencias Naturales",
    "Educación con Especialidad de Ciencias Sociales",
    "Educación con Especialidad de Educación Inicial",
    "Educación con Especialidad de Físico Matemático",
    "Educación con Especialidad de Lengua, Literatura, Filosofía y Psicología",
    "Educación con Especialidad de Educación Primaria",
    "Educación con Especialidad de Idiomas (Inglés - Francés)",
    "Educación con Especialidad de Educación Física",
    "Educación con Especialidad de Informática Educativa",
    "Historia",
    "Sociología",
    "Trabajo social",
    "Antropología",
    "Turismo y Hoteleria",
    "Derecho",
    "Economía",
    "Artes con Especialidad de Plásticas",
    "Artes con Especialidad de Música",
    "Filosofía",
    "Literatura y Lingüistica",
    "Psicología",
    "Relaciones Industriales",
    "Ciencias de la Comunicación con Especialidad en Periodismo",
    "Ciencias de la Comunicación con Especialidad en Relaciones Públicas",
  ];

  const filteredCareers = careerOptions.filter((career) =>
    career.toLowerCase().includes(careerSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!isAdmin && !isPsychologist && !isCoordinator) {
      toast.error(
        "Solo los administradores y psicólogos pueden completar citas"
      );
      navigate("/appointments");
      return;
    }

    const foundAppointment = appointments.find((apt) => apt.id === id);
    if (foundAppointment) {
      setAppointment(foundAppointment);
      setFormData({
        age: foundAppointment.age ? foundAppointment.age.toString() : "",
        gender: foundAppointment.gender || "",
        birthPlace: foundAppointment.birthPlace || "",
        birthDate: foundAppointment.birthDate || "",
        currentResidence: foundAppointment.currentResidence || "",
        maritalStatus: foundAppointment.maritalStatus || "",
        educationLevel: foundAppointment.educationLevel || "",
        currentApplication: foundAppointment.currentApplication || "",
        previousApplications: foundAppointment.previousApplications
          ? foundAppointment.previousApplications.toString()
          : "",
        firstEvaluationDate: foundAppointment.firstEvaluationDate || "",
      });
    }
  }, [id, appointments, isAdmin, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCareerSelect = (career: string) => {
    setFormData((prev) => ({
      ...prev,
      currentApplication: career,
    }));
    setCareerSearchTerm("");
    setShowCareerDropdown(false);
  };

  const handleCareerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      currentApplication: value,
    }));
    setCareerSearchTerm(value);
    setShowCareerDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    const completionData: Partial<Appointment> = {
      age: formData.age ? Number(formData.age) : undefined,
      gender: formData.gender as "masculino" | "femenino" | "otro" | undefined,
      birthPlace: formData.birthPlace || undefined,
      birthDate: formData.birthDate || undefined,
      currentResidence: formData.currentResidence || undefined,
      maritalStatus: formData.maritalStatus as
        | "soltero"
        | "casado"
        | "divorciado"
        | "viudo"
        | "conviviente"
        | undefined,
      educationLevel: formData.educationLevel as
        | "quinto_secundaria"
        | "egresado_secundaria"
        | "estudiante_pregrado"
        | "estudiante_instituto"
        | "egresado_universitario"
        | "profesional"
        | undefined,
      currentApplication: formData.currentApplication || undefined,
      previousApplications: formData.previousApplications
        ? Number(formData.previousApplications)
        : undefined,
      firstEvaluationDate: formData.firstEvaluationDate || undefined,
    };

    // Validate all required fields are filled
    if (!canCompleteAppointment(completionData)) {
      toast.error("Todos los campos académicos/demográficos son obligatorios para completar la cita");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedCompletion = async () => {
    if (!appointment) return;

    const completionData: Partial<Appointment> = {
      age: formData.age ? Number(formData.age) : undefined,
      gender: formData.gender as "masculino" | "femenino" | "otro" | undefined,
      birthPlace: formData.birthPlace || undefined,
      birthDate: formData.birthDate || undefined,
      currentResidence: formData.currentResidence || undefined,
      maritalStatus: formData.maritalStatus as
        | "soltero"
        | "casado"
        | "divorciado"
        | "viudo"
        | "conviviente"
        | undefined,
      educationLevel: formData.educationLevel as
        | "quinto_secundaria"
        | "egresado_secundaria"
        | "estudiante_pregrado"
        | "estudiante_instituto"
        | "egresado_universitario"
        | "profesional"
        | undefined,
      currentApplication: formData.currentApplication || undefined,
      previousApplications: formData.previousApplications
        ? Number(formData.previousApplications)
        : undefined,
      firstEvaluationDate: formData.firstEvaluationDate || undefined,
    };

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      await updateAppointmentStatus(
        appointment.id,
        "completed",
        completionData
      );
      navigate("/appointments");
    } catch (error) {
      console.error("Error al completar cita:", error);
      toast.error("Error al completar la cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Cita no encontrada
              </h3>
              <p className="text-sm text-red-700 mt-1">
                La cita que intentas completar no existe.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate("/appointments")}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Volver a citas
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Completar Cita</h1>
        <p className="text-gray-600">
          Cliente: {appointment.client.fullName} -{" "}
          {new Date(appointment.date + "T00:00:00").toLocaleDateString()} a las{" "}
          {appointment.time}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edad */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Edad *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Sexo */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sexo *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar...</option>
              {getGenderOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lugar de Nacimiento */}
          <div>
            <label
              htmlFor="birthPlace"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lugar de Nacimiento *
            </label>
            <input
              type="text"
              id="birthPlace"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Lugar de Residencia Actual */}
          <div>
            <label
              htmlFor="currentResidence"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lugar de Residencia Actual *
            </label>
            <input
              type="text"
              id="currentResidence"
              name="currentResidence"
              value={formData.currentResidence}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Estado Civil */}
          <div>
            <label
              htmlFor="maritalStatus"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estado Civil *
            </label>
            <select
              id="maritalStatus"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar...</option>
              {getMaritalStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grado de Instrucción */}
          <div>
            <label
              htmlFor="educationLevel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Grado de Instrucción *
            </label>
            <select
              id="educationLevel"
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar...</option>
              {getEducationLevelOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Postulación Actual */}
          <div className="relative">
            <label
              htmlFor="currentApplication"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Postulación Actual (Carrera) *
            </label>
            <div className="relative">
              <input
                type="text"
                id="currentApplication"
                name="currentApplication"
                value={formData.currentApplication}
                onChange={handleCareerInputChange}
                onFocus={() => setShowCareerDropdown(true)}
                placeholder="Buscar carrera..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCareerDropdown(!showCareerDropdown)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={16} />
              </button>
              {showCareerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCareers.length > 0 ? (
                    filteredCareers.map((career, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCareerSelect(career)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-900">{career}</span>
                        {formData.currentApplication === career && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No se encontraron carreras
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Número de Postulaciones Previas */}
          <div>
            <label
              htmlFor="previousApplications"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número de Postulaciones Previas *
            </label>
            <input
              type="number"
              id="previousApplications"
              name="previousApplications"
              value={formData.previousApplications}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha de la 1era Evaluación */}
          <div className="md:col-span-2">
            <label
              htmlFor="firstEvaluationDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha de la 1era Evaluación *
            </label>
            <input
              type="date"
              id="firstEvaluationDate"
              name="firstEvaluationDate"
              value={formData.firstEvaluationDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <Save size={16} className="mr-2" />
            {isSubmitting ? "Completando..." : "Completar Cita"}
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Completar Cita
              </h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                ¿Está seguro que desea completar esta cita?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ Importante: Una vez completada la cita, los datos guardados
                  serán <strong>inmodificables</strong> y no podrán ser editados
                  posteriormente.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmedCompletion}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? "Completando..." : "Sí, Completar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentComplete;
