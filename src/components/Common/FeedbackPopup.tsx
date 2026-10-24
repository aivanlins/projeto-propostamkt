import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { PopupFeedback } from '../../types';

interface FeedbackPopupProps {
  feedback: PopupFeedback;
  onFechar: () => void;
  tempoAutoFecharMs?: number;
}

export const FeedbackPopup: React.FC<FeedbackPopupProps> = ({
  feedback,
  onFechar,
  tempoAutoFecharMs = 4000,
}) => {
  useEffect(() => {
    if (feedback.aberto && tempoAutoFecharMs > 0) {
      const timer = setTimeout(() => {
        onFechar();
      }, tempoAutoFecharMs);
      return () => clearTimeout(timer);
    }
  }, [feedback.aberto, tempoAutoFecharMs, onFechar]);

  if (!feedback.aberto) return null;

  const isSucesso = feedback.tipo === 'sucesso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center transform transition-all animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
            isSucesso 
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20' 
              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shadow-rose-500/20'
          }`}>
            {isSucesso ? (
              <CheckCircle2 className="w-9 h-9" />
            ) : (
              <AlertTriangle className="w-9 h-9" />
            )}
          </div>

          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
            {feedback.titulo}
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6 leading-relaxed">
            {feedback.mensagem}
          </p>

          <button
            onClick={onFechar}
            className={`w-full py-3 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 ${
              isSucesso
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800'
            }`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
