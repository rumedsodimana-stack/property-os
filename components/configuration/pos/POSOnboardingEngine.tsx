import React, { useState } from 'react';
import { Store, LayoutGrid, Zap, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import CostCenterStep, { OnboardingOutlet } from './steps/CostCenterStep';
import SpaceConfigStep, { OnboardingSection } from './steps/SpaceConfigStep';
import DeployStep from './steps/DeployStep';
import { addItem } from '../../../services/kernel/firestoreService';
import { Outlet, Table } from '../../../types';

interface OnboardingData {
    outlets: OnboardingOutlet[];
    sections: OnboardingSection[];
}

const STEPS = [
    { id: 1, label: 'Cost Centers', sublabel: 'Define outlets', icon: Store },
    { id: 2, label: 'Space Config', sublabel: 'Sections & tables', icon: LayoutGrid },
    { id: 3, label: 'Activate', sublabel: 'Review & deploy', icon: Zap },
];

const SPACE_ELIGIBLE = ['Restaurant', 'Bar', 'PoolBar'];

const POSOnboardingEngine: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<OnboardingData>({ outlets: [], sections: [] });
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    const canProceed = () => {
        if (currentStep === 1) return data.outlets.length > 0;
        if (currentStep === 2) return true; // Space config is optional
        if (currentStep === 3) return data.outlets.length > 0 && !deployed;
        return false;
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            // Write each outlet to Firestore
            for (const o of data.outlets) {
                const outlet: Omit<Outlet, 'id'> = {
                    name: o.name,
                    type: o.type,
                    seatingCapacity: o.seatingCapacity,
                    description: o.description,
                    operatingHours: o.operatingHours,
                    taxRate: o.taxRate / 100,       // store as decimal
                    gratuityRate: o.gratuityRate / 100,
                    kdsEnabled: o.kdsEnabled,
                    color: o.color,
                    isActive: true,
                };
                await addItem('outlets', outlet);
            }

            // Generate and write tables from sections
            for (const section of data.sections) {
                const outlet = data.outlets.find(o => o.id === section.outletId);
                if (!outlet) continue;

                for (let i = 0; i < section.tableCount; i++) {
                    const tableNumber = section.startNumber + i;
                    const table: Omit<Table, 'id'> = {
                        number: String(tableNumber),
                        seats: section.seatsPerTable,
                        status: 'Available',
                        outletId: section.outletId,
                        section: section.name,
                    };
                    await addItem('tables', table);
                }
            }

            setDeployed(true);
        } catch (err) {
            console.error('POS deploy failed:', err);
            alert('Deployment failed. Please check your connection and try again.');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 3) {
            handleDeploy();
        } else {
            setCurrentStep(s => s + 1);
        }
    };

    const handleBack = () => setCurrentStep(s => s - 1);

    if (deployed) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                    <Check size={36} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-light text-white mb-2">F&B Module Activated</h2>
                <p className="text-zinc-400 text-sm max-w-md">
                    {data.outlets.length} outlet{data.outlets.length !== 1 ? 's' : ''} and {data.sections.reduce((a, s) => a + s.tableCount, 0)} tables have been written to the system. The POS Dashboard is now fully operational.
                </p>
                <div className="mt-8 flex gap-3">
                    <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                        Navigate to <span className="text-white font-bold">POS Dashboard</span> to start taking orders
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-900/30">
                        <Store size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light text-white">POS <span className="font-bold text-violet-400">Configuration Engine</span></h1>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Outlet Setup • Space Layout • Commissioning</p>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0 mb-10">
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;

                    return (
                        <React.Fragment key={step.id}>
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-600/20 border border-violet-500/40' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500' : isActive ? 'bg-violet-600' : 'bg-zinc-800'}`}>
                                    {isDone ? <Check size={14} className="text-white" /> : <Icon size={14} className="text-white" />}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${isActive ? 'text-violet-300' : isDone ? 'text-emerald-400' : 'text-zinc-500'}`}>{step.label}</div>
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider">{step.sublabel}</div>
                                </div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`flex-1 h-px mx-2 transition-all ${currentStep > step.id ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {currentStep === 1 && (
                    <CostCenterStep
                        outlets={data.outlets}
                        onUpdate={outlets => setData(d => ({ ...d, outlets }))}
                    />
                )}
                {currentStep === 2 && (
                    <SpaceConfigStep
                        outlets={data.outlets}
                        sections={data.sections}
                        onUpdate={sections => setData(d => ({ ...d, sections }))}
                    />
                )}
                {currentStep === 3 && (
                    <DeployStep
                        outlets={data.outlets}
                        sections={data.sections}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-800">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <div className="flex items-center gap-2">
                    {STEPS.map(s => (
                        <div key={s.id} className={`h-1.5 rounded-full transition-all ${currentStep === s.id ? 'w-6 bg-violet-500' : currentStep > s.id ? 'w-3 bg-emerald-500' : 'w-3 bg-zinc-700'}`} />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    disabled={!canProceed() || isDeploying}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${currentStep === 3 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
                >
                    {isDeploying ? (
                        <><Loader2 size={16} className="animate-spin" /> Deploying...</>
                    ) : currentStep === 3 ? (
                        <><Zap size={16} /> Activate F&B Module</>
                    ) : (
                        <>Next Step <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default POSOnboardingEngine;
