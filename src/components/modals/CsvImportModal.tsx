import React, { useState } from 'react';
import { PortfolioHolding } from '../../types/portfolio';
import {
  parseAndValidateCsv,
  CsvValidationResult,
  CSV_EXPECTED_HEADER,
  CSV_SAMPLE_TEMPLATE,
} from '../../utils/csvParser';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Copy, ArrowRight } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportHoldings: (holdings: Omit<PortfolioHolding, 'id'>[]) => void;
  existingHoldings: PortfolioHolding[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportHoldings,
  existingHoldings,
}) => {
  const [csvText, setCsvText] = useState(CSV_SAMPLE_TEMPLATE);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);

  if (!isOpen) return null;

  const handleCopyHeader = () => {
    navigator.clipboard.writeText(CSV_EXPECTED_HEADER);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2000);
  };

  const handleValidate = () => {
    const res = parseAndValidateCsv(csvText, existingHoldings);
    setValidationResult(res);
    playQuantumBeep(680, 0.04);
  };

  const handleConfirmImport = () => {
    if (!validationResult || !validationResult.canImport) return;
    const validHoldings = validationResult.rows
      .filter(r => r.isValid && r.parsedHolding)
      .map(r => r.parsedHolding!);

    onImportHoldings(validHoldings);
    playQuantumBeep(880, 0.08);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-3xl w-full border border-white/[0.12] space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-sky-400">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Import Portfolio Ledger via CSV</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expected CSV Header Structure */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Expected CSV Header Specification:</span>
            <button
              onClick={handleCopyHeader}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono-code"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedHeader ? 'Copied!' : 'Copy Header'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-[11px] text-sky-300 overflow-x-auto select-all">
            {CSV_EXPECTED_HEADER}
          </div>
          <p className="text-[11px] text-slate-400">
            Supports both <code className="text-slate-300">EQUITY</code> and <code className="text-slate-300">MUTUAL_FUND</code> records with either INR or USD settlement currency.
          </p>
        </div>

        {/* Raw CSV Text Area */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-300">Paste CSV Raw Rows:</label>
            <button
              onClick={() => setCsvText(CSV_SAMPLE_TEMPLATE)}
              className="text-[11px] text-slate-400 hover:text-sky-300"
            >
              Load Sample Template
            </button>
          </div>
          <textarea
            rows={5}
            value={csvText}
            onChange={e => {
              setCsvText(e.target.value);
              setValidationResult(null);
            }}
            placeholder="Paste your CSV content here..."
            className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Action: Validate & Preview */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleValidate}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold text-xs transition active:scale-95 flex items-center gap-2"
          >
            <span>Validate & Preview</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {validationResult && (
            <div className="flex items-center gap-3 text-xs font-mono-code">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {validationResult.validRowsCount} Valid
              </span>
              {validationResult.invalidRowsCount > 0 && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationResult.invalidRowsCount} Errors
                </span>
              )}
              {validationResult.duplicateRowsCount > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  {validationResult.duplicateRowsCount} Duplicates
                </span>
              )}
            </div>
          )}
        </div>

        {/* Parsed Preview Table */}
        {validationResult && (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-300">Parsed Records Verification:</div>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden max-h-52 overflow-y-auto">
              <table className="w-full text-left text-[11px] font-mono-code">
                <thead className="bg-black/50 text-slate-400 sticky top-0">
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Symbol / Scheme</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3 text-right">Qty / Units</th>
                    <th className="py-2 px-3 text-right">Avg Cost</th>
                    <th className="py-2 px-3">Currency</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {validationResult.rows.map(row => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? 'hover:bg-white/[0.02]' : 'bg-rose-500/10'}
                    >
                      <td className="py-1.5 px-3 text-slate-500">{row.rowNumber}</td>
                      <td className="py-1.5 px-3">{row.rawType}</td>
                      <td className="py-1.5 px-3 font-semibold text-white">{row.rawSymbolOrCode}</td>
                      <td className="py-1.5 px-3 truncate max-w-[120px] text-slate-300">{row.rawName}</td>
                      <td className="py-1.5 px-3 text-right text-white">{row.rawQuantity}</td>
                      <td className="py-1.5 px-3 text-right text-white">{row.rawAvgCost}</td>
                      <td className="py-1.5 px-3 text-slate-400">{row.rawCurrency}</td>
                      <td className="py-1.5 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-400 font-bold">Valid</span>
                        ) : (
                          <span className="text-rose-400" title={row.errors.join('; ')}>
                            {row.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!validationResult || !validationResult.canImport}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm ${
              validationResult && validationResult.canImport
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:scale-95'
                : 'bg-white/[0.04] text-slate-600 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Import ({validationResult?.validRowsCount || 0} Positions)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
