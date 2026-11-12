import React from 'react';
import { AlertNotification } from '../types/alert';
import { formatCurrency } from '../utils/currency';
import { Bell, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AlertToastContainerProps {
  notifications: AlertNotification[];
  onDismiss: (id: string) => void;
}

export const AlertToastContainer: React.FC<AlertToastContainerProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {notifications.map(toast => {
        const isAbove = toast.condition === 'ABOVE';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-2xl bg-[#090d18]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl text-xs space-y-2 relative overflow-hidden"
          >
            {/* Top rim accent */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-400 to-sky-400" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white font-mono-code text-sm">
                      {toast.symbol}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono-code font-semibold">
                      TRIGGER HIT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Threshold condition satisfied
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Breach Stats */}
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-between font-mono-code">
              <div>
                <span className="text-[10px] text-slate-500 block">Condition Target:</span>
                <span className="text-slate-300 flex items-center gap-1 font-semibold">
                  {isAbove ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                  {isAbove ? '≥ ' : '≤ '}
                  {formatCurrency(toast.targetPrice, toast.currency)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Trigger Mark:</span>
                <span className="text-amber-400 font-bold text-sm">
                  {formatCurrency(toast.currentPrice, toast.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
              <span>{new Date(toast.timestamp).toLocaleTimeString()}</span>
              <span className="text-sky-400">Marvex Terminal Engine</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
