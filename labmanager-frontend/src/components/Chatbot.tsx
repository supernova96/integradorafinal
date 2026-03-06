import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

const initialMessages: Message[] = [
  { id: '1', sender: 'bot', text: '¡Hola! Soy LabBot 🤖 ¿En qué puedo ayudarte hoy?' }
];

export interface ChatbotProps {
  userRole?: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simular respuesta del bot
    setTimeout(() => {
      respondToUser(userMessage.text.toLowerCase());
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const respondToUser = (input: string) => {
    const roleLower = userRole?.toLowerCase() || '';
    const isAdmin = roleLower.includes('admin') || roleLower.includes('administrador');
    let botResponse = isAdmin
      ? "Aún estoy aprendiendo 😅. Como Administrador, puedes preguntarme sobre: solicitudes, agregar equipos, gestionar incidentes o reportes."
      : "Aún estoy aprendiendo 😅. Pregúntame sobre cómo rentar, generar tu código QR o reportar un incidente.";

    if (input.includes('hola') || input.includes('buenas')) {
      botResponse = "¡Hola de nuevo! ¿Tienes alguna duda con LabManager?";
    } else if (input.includes('rentar') || input.includes('laptop') || input.includes('prestar') || input.includes('pedir')) {
      if (isAdmin) {
        botResponse = "Tú eres el Administrador 👑. Tú no rentas equipos directamente aquí, tú debes ir a la pestaña 'Solicitudes' para aprobar o rechazar las peticiones de los demás.";
      } else {
        botResponse = "Para rentar un equipo, dirígete a la pestaña de 'Inventario', selecciona la tarjeta del equipo y llena el formulario de reserva con tu clase.";
      }
    } else if (input.includes('aprobar') || input.includes('solicitud') || input.includes('rechazar')) {
      if (isAdmin) {
        botResponse = "Para aprobar o rechazar solicitudes, dirígete a la pestaña 'Solicitudes' (el primer icono de la barra izquierda). Ahí verás todas las peticiones pendientes.";
      } else {
        botResponse = "Las solicitudes deben ser aprobadas por un administrador. Recibirás una notificación cuando tu solicitud cambie de estado.";
      }
    } else if (input.includes('agregar') || input.includes('nuevo equipo') || input.includes('dar de alta')) {
      if (isAdmin) {
        botResponse = "Para agregar una Laptop o equipo nuevo al sistema, ve a la pestaña 'Inventario' y haz clic en el botón azul '+ Agregar Equipo' en la esquina superior derecha.";
      }
    } else if (input.includes('incidente') || input.includes('falla') || input.includes('roto') || input.includes('error')) {
      if (isAdmin) {
        botResponse = "Puedes gestionar y marcar los incidentes como 'Resueltos' desde la pestaña 'Incidentes' ⚠️. Los reportes recientes aparecerán ahí.";
      } else {
        botResponse = "Vaya, lamentamos el inconveniente. Puedes reportar un problema haciendo clic en la pestaña 'Reportar Falla'. Trata de adjuntar una foto de evidencia si el daño es visible.";
      }
    } else if (input.includes('qr') || input.includes('codigo') || input.includes('escanear')) {
      if (isAdmin) {
        botResponse = "Para marcar la entrega de un equipo, puedes encender la cámara web haciendo clic en el icono de QR 📷 ubicado arriba a la derecha, al lado de las notificaciones.";
      } else {
        botResponse = "Una vez que realices tu reserva o se te asigne un préstamo, podrás generar tu código QR para agilizar la entrega haciendo clic en el botón 'Ver QR' de tus solicitudes.";
      }
    } else if (input.includes('horario') || input.includes('tiempo') || input.includes('retraso')) {
      botResponse = "Recuerda que los equipos tienen tiempo límite. Si el tiempo expira, el sistema automáticamente lo marcará como Con Retraso (LATE).";
    }

    const botMsg: Message = {
      id: Date.now().toString(),
      sender: 'bot',
      text: botResponse
    };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col h-[400px]"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <h3 className="font-semibold text-lg drop-shadow-sm">LabBot Soporte</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-tl-sm shadow-sm'
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escribe tu duda aquí..."
                  className="w-full pl-4 pr-12 py-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-0 text-slate-800 dark:text-white text-sm transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  aria-label="Enviar mensaje"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-blue-600 hover:bg-blue-700 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/30 transition-shadow focus:outline-none z-[101]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir asistente de soporte"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
      </motion.button>
    </div>
  );
};
