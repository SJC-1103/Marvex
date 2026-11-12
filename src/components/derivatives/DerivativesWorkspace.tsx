import React, { useState } from 'react';
import { Layers, BarChart3, Activity, BookOpen, Compass, Sparkles } from 'lucide-react';
import { UnderlyingAsset } from '../../types/derivatives';
import { MOCK_UNDERLYINGS } from '../../data/derivativesData';
import { StrategyBuilder } from './StrategyBuilder';
import { UnderlyingAnalyticalReport } from './UnderlyingAnalyticalReport';
import { OptionChainView } from './OptionChainView';
import { GreeksLab } from './GreeksLab';
import { FOAcademy } from './FOAcademy';

export type FoSubWorkspace = 'builder' | 'report' | 'chain' | 'greeks' | 'academy';

export const DerivativesWorkspace: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<FoSubWorkspace>('builder');
  const [selectedUnderlying, setSelectedUnderlying] = useState<UnderlyingAsset>(MOCK_UNDERLYINGS[0]);

  const navSubTabs: { id: FoSubWorkspace; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'builder', label: 'Strategy Builder & Payoff', icon: Layers },
    { id: 'report', label: 'Underlying Stock & F&O Audit', icon: BarChart3 },
    { id: 'chain', label: 'Option Chain Matrix', icon: Compass },
    { id: 'greeks', label: 'Greeks Sensitivity Lab', icon: Activity },
    { id: 'academy', label: 'F&O Risk Academy', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Mode Sub-Navigation Tabs */}
      <div className="p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center gap-1.5 overflow-x-auto">
        {navSubTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub Workspace View */}
      {activeSubTab === 'builder' && (
        <StrategyBuilder
          selectedUnderlying={selectedUnderlying}
          onSelectUnderlying={setSelectedUnderlying}
        />
      )}

      {activeSubTab === 'report' && (
        <UnderlyingAnalyticalReport
          underlying={selectedUnderlying}
          onSelectUnderlying={setSelectedUnderlying}
          onOpenBuilderWithUnderlying={() => setActiveSubTab('builder')}
        />
      )}

      {activeSubTab === 'chain' && (
        <OptionChainView
          underlying={selectedUnderlying}
        />
      )}

      {activeSubTab === 'greeks' && (
        <GreeksLab
          underlying={selectedUnderlying}
        />
      )}

      {activeSubTab === 'academy' && (
        <FOAcademy />
      )}
    </div>
  );
};
