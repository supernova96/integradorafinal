import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addHours } from 'date-fns';
import { X, Clock, User, Calendar as CalendarIcon } from 'lucide-react';

interface Reservation {
    id: number;
    laptopModel: string;
    userName: string;
    startTime: string;
    durationMinutes?: number; // Depending on backend mapping, or we just mock end time 1 hour later
    status: string;
    subject: string;
    userRole?: string;
}

interface ReservationCalendarProps {
    reservations: Reservation[];
    isAdminView?: boolean;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({ reservations, isAdminView = false }) => {
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Mapear reservas a formato de eventos para FullCalendar
    const calendarEvents = reservations.map(res => {
        // Calcular hora de fin (asumimos bloques de 1 o 2 horas si no hay dato exacto)
        // Para profesores con batchId, podrían ser más largos. Usaremos 2 hrs por default para mostrar caja lógica
        const startDate = new Date(res.startTime);
        const endDate = addHours(startDate, 2);

        // Definir colores semánticos
        let bgColor = '#3b82f6'; // blue-500 (Default PENDING)

        if (res.status === 'APPROVED' || res.status === 'ACTIVE') {
            bgColor = '#10b981'; // emerald-500
        } else if (res.status === 'COMPLETED') {
            bgColor = '#64748b'; // slate-500
        } else if (res.status === 'REJECTED' || res.status === 'CANCELLED') {
            bgColor = '#ef4444'; // red-500
        } else if (res.status === 'LATE') {
            bgColor = '#f59e0b'; // amber-500
        }

        return {
            id: res.id.toString(),
            title: isAdminView ? `${res.laptopModel} - ${res.userName}` : res.laptopModel,
            start: startDate,
            end: endDate,
            backgroundColor: bgColor,
            borderColor: 'transparent',
            textColor: '#ffffff',
            extendedProps: { ...res } // Guardar data original para el modal
        };
    });

    const handleEventClick = (clickInfo: any) => {
        setSelectedEvent(clickInfo.event);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Aprobada</span>;
            case 'PENDING': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Pendiente</span>;
            case 'ACTIVE': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">En Uso</span>;
            case 'COMPLETED': return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">Completada</span>;
            case 'REJECTED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Rechazada</span>;
            case 'LATE': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Atraso</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <CalendarIcon className="mr-3 h-6 w-6 text-blue-500" />
                {isAdminView ? 'Calendario Global de Laboratorio' : 'Mi Agenda de Reservas'}
            </h2>

            {/* Contenedor Calendario con scroll horizontal en caso de pantallas pequeñas */}
            <div className="w-full relative z-10" style={{ minHeight: '600px' }}>
                <style>
                    {`
                    /* Override estilos de FullCalendar para modo claro/oscuro usando tailwind-like colors */
                    .fc-theme-standard .fc-scrollgrid { border-color: rgba(203, 213, 225, 0.5) !important; }
                    .dark .fc-theme-standard .fc-scrollgrid, .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: rgba(255, 255, 255, 0.1) !important; }
                    .dark .fc-col-header-cell-cushion, .dark .fc-daygrid-day-number { color: #f1f5f9 !important; }
                    .fc-col-header-cell-cushion, .fc-daygrid-day-number { color: #334155 !important; font-weight: 600 !important; }
                    .fc-button-primary { background-color: #3b82f6 !important; border-color: #3b82f6 !important; border-radius: 0.5rem !important; }
                    .fc-button-active { background-color: #1d4ed8 !important; }
                    .dark .fc-list-day-text, .dark .fc-list-day-side-text { color: #f1f5f9 !important; }
                    .fc-v-event { border-radius: 4px; border: none; padding: 2px 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin-bottom: 2px; }
                    .fc-event-main { font-weight: 500; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
                    .fc-timegrid-slot-label-cushion { font-size: 0.75rem; color: #64748b; }
                    .dark .fc-timegrid-slot-label-cushion { color: #94a3b8; }
                    `}
                </style>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    weekends={false}
                    locales={[esLocale]}
                    locale="es"
                    slotMinTime="07:00:00"
                    slotMaxTime="20:00:00"
                    expandRows={true}
                    height="650px"
                    nowIndicator={true}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    dayMaxEvents={true}
                    allDaySlot={false}
                    slotDuration="01:00:00"
                />
            </div>

            {/* Modal de Detalles del Evento (Framer Motion) */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: selectedEvent.backgroundColor }} />

                            <div className="flex justify-between items-start p-6 pb-2 border-b border-slate-100 dark:border-white/5">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        {isAdminView && <><User className="h-4 w-4" /> Solicitante: {selectedEvent.extendedProps.userName}</>}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl flex-shrink-0">
                                        <Clock className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                            <div>
                                                <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Inicio</p>
                                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {format(new Date(selectedEvent.extendedProps.startTime), 'dd MMM, HH:mm')} hrs
                                                </p>
                                            </div>
                                            <div className="hidden sm:block text-slate-300 dark:text-slate-600">→</div>
                                            <div className="mt-2 sm:mt-0">
                                                <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Fin (aprox)</p>
                                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {format(selectedEvent.end, 'dd MMM, HH:mm')} hrs
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                        <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">Materia</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{selectedEvent.extendedProps.subject}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center">
                                        <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">Estado Act.</p>
                                        {getStatusBadge(selectedEvent.extendedProps.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    Cerrar Detalles
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
