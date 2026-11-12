import React, { useState } from 'react';
import { Currency } from '../../types/market';
import { formatCurrency } from '../../utils/currency';
import { X, DollarSign, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface CashBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCash: number;
  bookCurrency: Currency;
  onUpdateCash: (newAmount: number) => void;
}

export const CashBalanceModal: React.FC<CashBalanceModalProps> = ({
  isOpen,
  onClose,
  currentCash,
  bookCurrency,
  onUpdateCash,
}) => {
  const [mode, setMode] = useState<'set' | 'deposit' | 'withdraw'>('set');
  const [amountStr, setAmountStr] = useState<string>(currentCash.toString());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountStr);
    if (isNaN(val) || val < 0) {
      setError('Please provide a valid non-negative amount.');
      return;
    }

    let nextCash = currentCash;
    if (mode === 'set') {
      nextCash = val;
    } else if (mode === 'deposit') {
      nextCash = currentCash + val;
    } else if (mode === 'withdraw') {
      if (val > currentCash) {
        setError('Withdrawal exceeds current available cash balance.');
        return;
      }
      nextCash = currentCash - val;
    }

    onUpdateCash(nextCash);
    playQuantumBeep(700, 0.05);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-md w-full border border-white/[0.12] space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <DollarSign className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Manage Cash Balance</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Chip */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono-code">
          <span className="text-slate-400">Current Liquid Cash:</span>
          <span className="text-emerald-400 font-bold text-sm">
            {formatCurrency(currentCash, bookCurrency)}
          </span>
        </div>

        {/* Action Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('set');
              setAmountStr(currentCash.toString());
              setError(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition ${
              mode === 'set' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Set Balance
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('deposit');
              setAmountStr('');
              setError(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition ${
              mode === 'deposit' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Deposit
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('withdraw');
              setAmountStr('');
              setError(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition ${
              mode === 'withdraw' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            - Withdraw
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-slate-300">
              {mode === 'set' ? 'New Total Cash Balance' : mode === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'} ({bookCurrency})
            </label>
            <input
              type="number"
              step="any"
              value={amountStr}
              onChange={e => {
                setAmountStr(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono-code focus:outline-none focus:border-sky-400 text-sm"
              autoFocus
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Cash Balance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
