import React, { useState } from 'react';
import { Currency } from '../../types/market';
import { X, Plus, BookOpen } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (name: string, description?: string, baseCurrency?: Currency) => void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<Currency>('INR');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a portfolio book title.');
      return;
    }
    onCreateBook(name.trim(), description.trim() || undefined, baseCurrency);
    playQuantumBeep(720, 0.05);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-md w-full border border-white/[0.12] space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-sky-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Create New Portfolio Book</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-slate-300">Book Name</label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. High Alpha Tech, Dividend Income, Children's Education"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-sky-400"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-300">Strategy Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Core index funds and large-cap compounders held with multi-year horizon."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-300">Reporting Currency</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBaseCurrency('INR')}
                className={`py-2 px-3 rounded-xl border text-center font-mono-code transition ${
                  baseCurrency === 'INR'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                }`}
              >
                ₹ INR (Rupees)
              </button>
              <button
                type="button"
                onClick={() => setBaseCurrency('USD')}
                className={`py-2 px-3 rounded-xl border text-center font-mono-code transition ${
                  baseCurrency === 'USD'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                }`}
              >
                $ USD (US Dollars)
              </button>
            </div>
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
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Book</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
