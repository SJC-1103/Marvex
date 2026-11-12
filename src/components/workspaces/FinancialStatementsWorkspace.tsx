import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  PieChart,
  BarChart3,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Calculator,
  Scale,
  X,
  Info,
} from 'lucide-react';
import { FINANCIAL_DOSSIERS, CompanyFinancialDossier } from '../../data/financialStatementsData';
import { Stock } from '../../types/market';
import { playQuantumBeep } from '../../utils/audio';

interface FinancialStatementsWorkspaceProps {
  availableStocks: Stock[];
  selectedStockId?: string;
}

export const FinancialStatementsWorkspace: React.FC<FinancialStatementsWorkspaceProps> = ({
  availableStocks,
  selectedStockId,
}) => {
  // Find initial symbol
  const initialStock = availableStocks.find(s => s.id === selectedStockId) || availableStocks[0];
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const sym = initialStock?.symbol.toUpperCase();
    return FINANCIAL_DOSSIERS[sym] ? sym : 'RELIANCE';
  });

  const [activeStatementTab, setActiveStatementTab] = useState<'INCOME' | 'BALANCE_SHEET' | 'CASH_FLOW'>('INCOME');
  const [aiGeneratingSummary, setAiGeneratingSummary] = useState(false);
  const [customAiNote, setCustomAiNote] = useState<string | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);

  const dossier: CompanyFinancialDossier = FINANCIAL_DOSSIERS[selectedSymbol] || FINANCIAL_DOSSIERS['RELIANCE'];
  const currencySymbol = dossier.currency === 'USD' ? '$' : '₹';
  const unitLabel = dossier.currency === 'USD' ? 'M' : 'Cr';

  const handleGenerateAiVerdict = () => {
    setAiGeneratingSummary(true);
    setTimeout(() => {
      setCustomAiNote(
        `AI Forensic Synthesis for ${dossier.symbol}: Balance sheet health confirmed top-tier (Score: ${dossier.highlights.verdictScore}/100). Operating cash flow of ${currencySymbol}${dossier.cashFlow.operatingCashFlowCr.toLocaleString()} ${unitLabel} comfortably covers ongoing capital expenditures, leaving ${currencySymbol}${dossier.cashFlow.freeCashFlowCr.toLocaleString()} ${unitLabel} in pristine Free Cash Flow. Solvency risk is rated ${dossier.highlights.solvencyRisk.replace('_', ' ')}.`
      );
      setAiGeneratingSummary(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Header Card: Company Selector & Filing Meta */}
      <div className="p-5 rounded-2xl bg-[#090d19] border border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono-code text-[10px] font-bold uppercase tracking-wider">
              Audited Filing Dual-Perspective View
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-mono-code text-slate-400">
              {dossier.quarter} ({dossier.fiscalYear})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              {dossier.name}
            </h2>
            <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-sky-400 font-mono-code text-xs font-bold">
              {dossier.symbol}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Independent Audit: <strong className="text-slate-300">{dossier.auditFirm}</strong> · Filed on {dossier.filingDate}
          </p>
        </div>

        {/* Stock Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono-code text-slate-400 uppercase tracking-wider hidden sm:inline">
            Select Company:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {Object.keys(FINANCIAL_DOSSIERS).map(sym => {
              const isSelected = sym === selectedSymbol;
              return (
                <button
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    setCustomAiNote(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-code font-bold transition ${
                    isSelected
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Split-Screen View: Left = Statement | Right = Key Investor Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE (7 COLS): Latest Financial Statement */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                Audited Financial Statement ({dossier.quarter})
              </h3>
            </div>

            {/* Statement Type Sub-Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setActiveStatementTab('INCOME')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition ${
                  activeStatementTab === 'INCOME'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setActiveStatementTab('BALANCE_SHEET')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition ${
                  activeStatementTab === 'BALANCE_SHEET'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Balance Sheet
              </button>
              <button
                onClick={() => setActiveStatementTab('CASH_FLOW')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition ${
                  activeStatementTab === 'CASH_FLOW'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cash Flow
              </button>
            </div>
          </div>

          {/* Statement Content Box */}
          <div className="rounded-2xl bg-black/40 border border-white/[0.08] overflow-hidden">
            {/* Income Statement Table */}
            {activeStatementTab === 'INCOME' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-code">
                  <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4 font-heading text-slate-300">Line Item</th>
                      <th className="py-2.5 px-4 text-right">Value ({currencySymbol} {unitLabel})</th>
                      <th className="py-2.5 px-4 text-right">YoY %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="hover:bg-white/[0.02] font-semibold text-white">
                      <td className="py-2.5 px-4">Total Revenue / Turnover</td>
                      <td className="py-2.5 px-4 text-right font-bold text-sky-400">
                        {currencySymbol}{dossier.incomeStatement.totalRevenueCr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-400">
                        +{dossier.incomeStatement.revenueGrowthYoy}%
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Less: Operating Expenses</td>
                      <td className="py-2.5 px-4 text-right">
                        ({currencySymbol}{dossier.incomeStatement.operatingExpensesCr.toLocaleString()})
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] font-bold text-white bg-white/[0.01]">
                      <td className="py-2.5 px-4 text-emerald-300">EBITDA (Operating Profit)</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        {currencySymbol}{dossier.incomeStatement.ebitdaCr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        {dossier.incomeStatement.ebitdaMarginPercent}% Mgn
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Less: Depreciation & Amortization</td>
                      <td className="py-2.5 px-4 text-right">
                        ({currencySymbol}{dossier.incomeStatement.depreciationAmortizationCr.toLocaleString()})
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2.5 px-4">EBIT (Operating Earnings)</td>
                      <td className="py-2.5 px-4 text-right font-semibold">
                        {currencySymbol}{dossier.incomeStatement.ebitCr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Less: Finance & Interest Costs</td>
                      <td className="py-2.5 px-4 text-right text-rose-300">
                        ({currencySymbol}{dossier.incomeStatement.interestExpenseCr.toLocaleString()})
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2.5 px-4">Profit Before Tax (PBT)</td>
                      <td className="py-2.5 px-4 text-right font-semibold">
                        {currencySymbol}{dossier.incomeStatement.profitBeforeTaxCr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Less: Income Tax Provision</td>
                      <td className="py-2.5 px-4 text-right">
                        ({currencySymbol}{dossier.incomeStatement.taxExpenseCr.toLocaleString()})
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] font-bold text-white bg-indigo-500/[0.08]">
                      <td className="py-3 px-4 text-indigo-300">Net Profit for the Period (PAT)</td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-300 text-sm">
                        {currencySymbol}{dossier.incomeStatement.netProfitCr.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-indigo-300 font-bold">
                        {dossier.incomeStatement.netProfitMarginPercent}% Mgn
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2.5 px-4 font-semibold">Trailing Diluted EPS</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        {currencySymbol}{dossier.incomeStatement.epsTrailing}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">per share</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Balance Sheet Table */}
            {activeStatementTab === 'BALANCE_SHEET' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-code">
                  <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4 font-heading text-slate-300">Balance Sheet Position</th>
                      <th className="py-2.5 px-4 text-right">Amount ({currencySymbol} {unitLabel})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="bg-white/[0.02] font-bold text-white">
                      <td className="py-2.5 px-4 text-sky-400">I. TOTAL ASSETS</td>
                      <td className="py-2.5 px-4 text-right text-sky-400">
                        {currencySymbol}{dossier.balanceSheet.totalAssetsCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Cash, Bank & Liquid Equivalents</td>
                      <td className="py-2 px-4 text-right text-emerald-400 font-semibold">
                        {currencySymbol}{dossier.balanceSheet.cashAndBankCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Inventories & Work in Progress</td>
                      <td className="py-2 px-4 text-right">
                        {currencySymbol}{dossier.balanceSheet.inventoriesCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Property, Plant & Equipment (Gross Block)</td>
                      <td className="py-2 px-4 text-right">
                        {currencySymbol}{dossier.balanceSheet.propertyPlantEquipmentCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-white/[0.02] font-bold text-white">
                      <td className="py-2.5 px-4 text-rose-400">II. TOTAL LIABILITIES & BORROWINGS</td>
                      <td className="py-2.5 px-4 text-right text-rose-400">
                        {currencySymbol}{dossier.balanceSheet.totalLiabilitiesCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Short-Term Working Capital Debt</td>
                      <td className="py-2 px-4 text-right text-rose-300">
                        {currencySymbol}{dossier.balanceSheet.shortTermDebtCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Long-Term Bonds & Loans</td>
                      <td className="py-2 px-4 text-right text-rose-300 font-semibold">
                        {currencySymbol}{dossier.balanceSheet.longTermDebtCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-white/[0.02] font-bold text-white">
                      <td className="py-2.5 px-4 text-indigo-400">III. SHAREHOLDERS NET WORTH / EQUITY</td>
                      <td className="py-2.5 px-4 text-right text-indigo-400">
                        {currencySymbol}{dossier.balanceSheet.shareholdersEquityCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-4 pl-8">Retained Earnings & Reserves</td>
                      <td className="py-2 px-4 text-right text-indigo-300 font-semibold">
                        {currencySymbol}{dossier.balanceSheet.retainedEarningsCr.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Cash Flow Statement */}
            {activeStatementTab === 'CASH_FLOW' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-code">
                  <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4 font-heading text-slate-300">Cash Flow Category</th>
                      <th className="py-2.5 px-4 text-right">Cash Generation ({currencySymbol} {unitLabel})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="hover:bg-white/[0.02] font-semibold text-white">
                      <td className="py-2.5 px-4 text-emerald-400">Cash Flow from Operations (CFO)</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        +{currencySymbol}{dossier.cashFlow.operatingCashFlowCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Capital Expenditures (Capex Outlay)</td>
                      <td className="py-2.5 px-4 text-right text-rose-300">
                        ({currencySymbol}{dossier.cashFlow.capexCr.toLocaleString()})
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] font-bold text-white bg-emerald-500/[0.08]">
                      <td className="py-3 px-4 text-emerald-300">Free Cash Flow (FCF = CFO - Capex)</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-300 text-sm">
                        +{currencySymbol}{dossier.cashFlow.freeCashFlowCr.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2.5 px-4">Cash Flow from Financing Activities</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">
                        ({currencySymbol}{Math.abs(dossier.cashFlow.financingCashFlowCr).toLocaleString()})
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] text-slate-400">
                      <td className="py-2.5 px-4 pl-8">Dividends & Buybacks Distributed</td>
                      <td className="py-2.5 px-4 text-right text-amber-300">
                        ({currencySymbol}{dossier.cashFlow.dividendsPaidCr.toLocaleString()})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE (5 COLS): Essential Investor Highlights & AI Verdict */}
        <div className="lg:col-span-5 space-y-4">
          {/* Executive Verdict Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-[#0a0e1c] to-[#070b16] border border-indigo-500/30 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Investor Essential Highlights</span>
              </span>

              {/* Total Verdict Score with Formula Hover Tooltip & Modal Opener */}
              <div className="relative group/score">
                <button
                  onClick={() => {
                    setShowScoringModal(true);
                    playQuantumBeep(680, 0.03);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono-code text-xs font-bold transition cursor-pointer active:scale-95"
                  title="Click to view full scoring model rubric and weights"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Score: {dossier.highlights.verdictScore}/100</span>
                </button>

                {/* Score Formula Floating Tooltip */}
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-[#0b1020] border border-emerald-500/30 shadow-2xl z-50 text-left opacity-0 pointer-events-none group-hover/score:opacity-100 group-hover/score:pointer-events-auto transition-opacity duration-150">
                  <div className="text-[11px] font-heading font-bold text-emerald-300 mb-1 flex items-center justify-between">
                    <span>Fundamental Verdict Formula</span>
                    <span className="text-[10px] text-slate-400 font-mono-code">Model v3</span>
                  </div>
                  <div className="text-[10px] font-mono-code bg-black/50 p-2 rounded border border-white/[0.08] text-slate-200 mb-2">
                    Score = (0.40 × {dossier.highlights.profitabilitySubScore.score}) + (0.35 × {dossier.highlights.solvencySubScore.score}) + (0.25 × {dossier.highlights.growthSubScore.score}) = <strong>{dossier.highlights.verdictScore}/100</strong>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono-code text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Profitability (40%):</span>
                      <span>+{(0.40 * dossier.highlights.profitabilitySubScore.score).toFixed(1)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sky-400">Solvency (35%):</span>
                      <span>+{(0.35 * dossier.highlights.solvencySubScore.score).toFixed(1)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Trajectory (25%):</span>
                      <span>+{(0.25 * dossier.highlights.growthSubScore.score).toFixed(1)} pts</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/[0.08] text-[9px] text-sky-400 font-mono-code flex items-center gap-1 cursor-pointer">
                    <span>Click badge to view full scoring criteria rubric →</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "{dossier.highlights.executiveVerdict}"
            </p>

            {/* 3 Interactive Sub-Criteria Tiles with Hover Tooltips showing exact Score / 100 */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-code text-[10px]">
              {/* Profitability Sub-Score */}
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] transition-all relative group/profit cursor-help">
                <div className="text-slate-500 uppercase flex items-center justify-center gap-1">
                  <span>Profitability</span>
                  <HelpCircle className="w-2.5 h-2.5 text-slate-500 group-hover/profit:text-emerald-400" />
                </div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                  {dossier.highlights.profitabilitySubScore.score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-[9px] text-emerald-300 font-medium truncate mt-0.5">
                  {dossier.highlights.profitabilityHealth}
                </div>

                {/* Profitability Hover Breakdown Card */}
                <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 rounded-xl bg-[#090e1a] border border-emerald-500/30 shadow-2xl z-50 text-left opacity-0 pointer-events-none group-hover/profit:opacity-100 transition-opacity duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
                    <span className="font-heading font-bold text-emerald-300 text-xs">Profitability Audit</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                      {dossier.highlights.profitabilitySubScore.score}/100 · W: 40%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 leading-tight">
                    {dossier.highlights.profitabilitySubScore.criteriaSummary}
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {dossier.highlights.profitabilitySubScore.metrics.map((m, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                        <div className="flex justify-between font-bold text-white">
                          <span>{m.name}</span>
                          <span className="text-emerald-400">{m.value}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>Bench: {m.benchmark}</span>
                          <span className="text-slate-300">Score: {m.earned}/{m.max} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2 font-mono-code">
                    Formula: {dossier.highlights.profitabilitySubScore.formula}
                  </div>
                </div>
              </div>

              {/* Solvency Sub-Score */}
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-sky-500/40 hover:bg-sky-500/[0.03] transition-all relative group/solv cursor-help">
                <div className="text-slate-500 uppercase flex items-center justify-center gap-1">
                  <span>Solvency</span>
                  <HelpCircle className="w-2.5 h-2.5 text-slate-500 group-hover/solv:text-sky-400" />
                </div>
                <div className="text-base font-extrabold text-sky-400 mt-0.5">
                  {dossier.highlights.solvencySubScore.score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-[9px] text-sky-300 font-medium truncate mt-0.5">
                  {dossier.highlights.solvencySubScore.rating}
                </div>

                {/* Solvency Hover Breakdown Card */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3.5 rounded-xl bg-[#090e1a] border border-sky-500/30 shadow-2xl z-50 text-left opacity-0 pointer-events-none group-hover/solv:opacity-100 transition-opacity duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
                    <span className="font-heading font-bold text-sky-300 text-xs">Solvency & Debt Health</span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                      {dossier.highlights.solvencySubScore.score}/100 · W: 35%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 leading-tight">
                    {dossier.highlights.solvencySubScore.criteriaSummary}
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {dossier.highlights.solvencySubScore.metrics.map((m, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                        <div className="flex justify-between font-bold text-white">
                          <span>{m.name}</span>
                          <span className="text-sky-400">{m.value}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>Bench: {m.benchmark}</span>
                          <span className="text-slate-300">Score: {m.earned}/{m.max} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2 font-mono-code">
                    Formula: {dossier.highlights.solvencySubScore.formula}
                  </div>
                </div>
              </div>

              {/* Trajectory (Growth) Sub-Score */}
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all relative group/grow cursor-help">
                <div className="text-slate-500 uppercase flex items-center justify-center gap-1">
                  <span>Trajectory</span>
                  <HelpCircle className="w-2.5 h-2.5 text-slate-500 group-hover/grow:text-purple-400" />
                </div>
                <div className="text-base font-extrabold text-purple-400 mt-0.5">
                  {dossier.highlights.growthSubScore.score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-[9px] text-purple-300 font-medium truncate mt-0.5">
                  {dossier.highlights.growthSubScore.rating}
                </div>

                {/* Trajectory Hover Breakdown Card */}
                <div className="absolute right-0 bottom-full mb-2 w-72 p-3.5 rounded-xl bg-[#090e1a] border border-purple-500/30 shadow-2xl z-50 text-left opacity-0 pointer-events-none group-hover/grow:opacity-100 transition-opacity duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
                    <span className="font-heading font-bold text-purple-300 text-xs">Growth & Expansion</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                      {dossier.highlights.growthSubScore.score}/100 · W: 25%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 leading-tight">
                    {dossier.highlights.growthSubScore.criteriaSummary}
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {dossier.highlights.growthSubScore.metrics.map((m, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                        <div className="flex justify-between font-bold text-white">
                          <span>{m.name}</span>
                          <span className="text-purple-400">{m.value}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>Bench: {m.benchmark}</span>
                          <span className="text-slate-300">Score: {m.earned}/{m.max} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2 font-mono-code">
                    Formula: {dossier.highlights.growthSubScore.formula}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Forensic Synthesis Callout */}
          <div className="p-4 rounded-2xl bg-purple-500/[0.07] border border-purple-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse-gentle" />
                <span>AI Financial Analyst Synthesis</span>
              </span>
              <button
                onClick={handleGenerateAiVerdict}
                disabled={aiGeneratingSummary}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/30 text-purple-200 font-mono-code text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>{aiGeneratingSummary ? 'Auditing...' : 'Re-Audit with AI'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {customAiNote || dossier.highlights.keyTakeaways[0]}
            </p>
          </div>

          {/* Key Bullet Highlights */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
            <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Core Operational Highlights</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {dossier.highlights.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Crucial Ratios Matrix with Formula Tooltips */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                Critical Investor Ratios
              </h4>
              <span className="text-[10px] font-mono-code text-slate-500">Hover for formula</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {dossier.highlights.crucialRatios.map((ratio, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] space-y-1 transition group relative"
                >
                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="text-slate-400 text-[11px]">{ratio.label}</span>
                    <span className="font-bold text-white text-xs">{ratio.value}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {ratio.description}
                  </p>
                  {ratio.formula && (
                    <div className="text-[9px] font-mono-code text-sky-400/80 pt-0.5 border-t border-white/[0.04]">
                      ƒ: {ratio.formula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Model & Criteria Methodology Modal */}
      {showScoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-[#090e1c] border border-white/[0.12] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-heading font-bold text-white">
                  Marvex Fundamental Quality Scoring Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowScoringModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Score Equation */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
              <div className="text-xs font-mono-code font-bold text-sky-300 uppercase tracking-wider">
                Overall Weighted Model Equation
              </div>
              <div className="text-xs font-mono-code text-emerald-400 font-bold bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                Total Score (0–100) = (40% × Profitability) + (35% × Solvency) + (25% × Growth)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every audited filing is evaluated against standardized sector benchmarks. Scores above 80 represent institutional investment-grade balance sheets; scores below 70 indicate elevated cash burn or leverage risks.
              </p>
            </div>

            {/* The 3 Pillars Breakdown */}
            <div className="space-y-3 text-xs">
              {/* Pillar 1 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between font-heading font-bold text-emerald-300">
                  <span>1. Profitability & Cash Flow Conversion (40% Weight)</span>
                  <span className="font-mono-code text-[11px]">Score: {dossier.highlights.profitabilitySubScore.score}/100</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Evaluates the economic moat and operating conversion efficiency. Measures whether reported accounting net profits translate directly into free cash flow after all sustaining capital expenditures.
                </p>
                <div className="text-[10px] font-mono-code text-slate-400">
                  Formula: {dossier.highlights.profitabilitySubScore.formula}
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-sky-500/20 space-y-1.5">
                <div className="flex items-center justify-between font-heading font-bold text-sky-300">
                  <span>2. Solvency & Balance Sheet Health (35% Weight)</span>
                  <span className="font-mono-code text-[11px]">Score: {dossier.highlights.solvencySubScore.score}/100</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Measures credit risk, bondholder protection, and debt service capability. Assesses whether cash reserves comfortably buffer short-term maturities and verifies the presence of unencumbered equity.
                </p>
                <div className="text-[10px] font-mono-code text-slate-400">
                  Formula: {dossier.highlights.solvencySubScore.formula}
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between font-heading font-bold text-purple-300">
                  <span>3. Growth Trajectory & Reinvestment (25% Weight)</span>
                  <span className="font-mono-code text-[11px]">Score: {dossier.highlights.growthSubScore.score}/100</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Quantifies year-over-year revenue expansion, EBITDA acceleration, and long-term deal pipeline momentum compared against inflation and sector GDP growth rates.
                </p>
                <div className="text-[10px] font-mono-code text-slate-400">
                  Formula: {dossier.highlights.growthSubScore.formula}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowScoringModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono-code text-xs font-bold transition"
              >
                Close Rubric
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
