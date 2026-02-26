import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, BedDouble, Tag, Map, Rocket, CheckCircle } from 'lucide-react';
import DNAStep from './steps/DNAStep';
import TraitStep from './steps/TraitStep';
import BlueprintStep from './steps/BlueprintStep';
import ReviewStep from './steps/ReviewStep';
import { saveRooms, saveRoomTypes, saveAttributes } from '../../../services/operations/roomService';
import { addItem, updateItem } from '../../../services/kernel/firestoreService';
import { Room, RoomStatus } from '../../../types';

export type OnboardingData = {
    categories: any[];
    attributes: any[];
    floors: any[];
    rooms: any[];
};

const PropertyOnboardingEngine: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [deployed, setDeployed] = useState(false);
    const [deployedRoomCount, setDeployedRoomCount] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        categories: [],
        attributes: [],
        floors: [],
        rooms: []
    });

    const steps = [
        { id: 1, title: 'Class Blueprint', subtitle: 'Define your room types', icon: BedDouble },
        { id: 2, title: 'Trait Library', subtitle: 'Define premium modifiers', icon: Tag },
        { id: 3, title: 'Physical Blueprint', subtitle: 'Map your hotel layout', icon: Map },
        { id: 4, title: 'Final Deployment', subtitle: 'Review and go live', icon: Rocket },
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const updateData = (key: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const [deploying, setDeploying] = useState(false);

    const handleDeploy = async () => {
        setDeploying(true);
        // 1. Map categories to RoomType format
        const roomTypes = data.categories.map(c => ({
            id: c.id,
            name: c.name,
            description: `Standard ${c.name} configuration`,
            baseRate: c.baseRate,
            maxOccupancy: c.maxOccupancy,
            defaultAttributes: [],
            amenities: ['Wifi', 'TV'],
            image: '',
            sizeSqM: 30
        }));

        // 2. Map rooms to Room format
        const finalRooms: Room[] = data.rooms.map(r => ({
            id: r.id,
            typeId: r.categoryId,
            number: r.number,
            floor: r.floor ?? r.number.charAt(0),
            status: RoomStatus.CLEAN_READY,
            attributes: [],
            connectsTo: [],
            isVirtual: false,
            componentRoomIds: [],
            maintenanceProfile: {
                lastRenovated: Date.now(),
                conditionScore: 100,
                noiseLevel: 'Low',
                features: [],
                openTickets: 0
            },
            iotStatus: { temp: 21, lights: 0, doorLocked: true, carbonFootprint: 0, humidity: 40, occupancyDetected: false }
        }));

        // 3. Map attributes
        const finalAttributes = data.attributes.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            priceModifier: a.priceModifier,
            icon: 'Tag'
        }));

        // ── Save to localStorage (fallback) ──────────────────────────────
        saveRoomTypes(roomTypes);
        saveRooms(finalRooms);
        saveAttributes(finalAttributes);

        // ── Save to Firestore (live sync → FrontDesk + Housekeeping) ─────
        try {
            await Promise.all([
                ...finalRooms.map(room => addItem('rooms', room)),
            ]);
        } catch (err) {
            console.error('Firestore deploy error:', err);
        }

        setDeploying(false);
        setDeployedRoomCount(finalRooms.length);
        setDeployed(true);
    };

    // ── Success Screen ─────────────────────────────────────────────────────
    if (deployed) {
        return (
            <div className="max-w-2xl mx-auto mt-24 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>
                <h2 className="text-3xl font-light text-white">Property Deployed!</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    <span className="font-bold text-emerald-400">{deployedRoomCount} rooms</span> are now live and available for Front Desk allocation. Room types, attributes and floor plans have been saved successfully.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => { setDeployed(false); setCurrentStep(1); setData({ categories: [], attributes: [], floors: [], rooms: [] }); }}
                        className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
                    >
                        Start New Onboarding
                    </button>
                    <button
                        onClick={() => setDeployed(false)}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-500/20"
                    >
                        Back to Configuration
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Onboarding Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-zinc-900/40 p-10 rounded-[3rem] border border-zinc-800 relative overflow-hidden group">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Day 0 Integration</span>
                    </div>
                    <h1 className="text-5xl font-light text-white tracking-tighter leading-tight">
                        Property <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-zinc-500">Onboarding</span>
                    </h1>
                    <p className="text-zinc-500 mt-4 max-w-xl text-lg font-medium leading-relaxed">
                        Welcome to Hotel Singularity OS. Let's sculpt your property's digital twin in four high-integrity steps.
                    </p>
                </div>

                {/* Progress Stepper */}
                <div className="relative z-10 w-full md:w-auto flex flex-col items-end">
                    <div className="flex gap-2 mb-4">
                        {steps.map(s => (
                            <div
                                key={s.id}
                                className={`h-1.5 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'w-12 bg-indigo-500 shadow-[0_0_15px_#6366f1]' : 'w-4 bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-white italic">0{currentStep}</span>
                        <span className="text-zinc-700 font-black text-xl ml-1">/ 04</span>
                    </div>
                </div>
            </div>

            {/* Step Navigation Sidebar (Desktop) */}
            <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-3 space-y-3">
                    {steps.map(step => (
                        <div
                            key={step.id}
                            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${currentStep === step.id
                                ? 'bg-zinc-900 border-zinc-700 shadow-xl'
                                : 'bg-transparent border-transparent opacity-40 grayscale group hover:opacity-100 hover:grayscale-0'
                                }`}
                        >
                            <div className={`p-3 rounded-xl border ${currentStep >= step.id ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                                }`}>
                                <step.icon size={18} />
                            </div>
                            <div>
                                <h3 className={`text-xs font-black uppercase tracking-widest ${currentStep === step.id ? 'text-white' : 'text-zinc-500'}`}>
                                    {step.title}
                                </h3>
                                <p className="text-[10px] text-zinc-600 font-bold">{step.subtitle}</p>
                            </div>
                            {currentStep > step.id && (
                                <CheckCircle2 size={16} className="ml-auto text-emerald-500" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="col-span-9 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-[3rem] min-h-[650px] flex flex-col overflow-hidden relative shadow-2xl">
                    <div className="flex-1 p-10 overflow-y-auto">
                        {currentStep === 1 && <DNAStep data={data.categories} onUpdate={(val) => updateData('categories', val)} />}
                        {currentStep === 2 && <TraitStep data={data.attributes} onUpdate={(val) => updateData('attributes', val)} />}
                        {currentStep === 3 && <BlueprintStep data={data} onUpdate={(key, val) => updateData(key as any, val)} />}
                        {currentStep === 4 && <ReviewStep data={data} />}
                    </div>

                    {/* Action Bar */}
                    <div className="p-8 bg-zinc-950/80 border-t border-zinc-800 flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                                }`}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        <button
                            onClick={currentStep === 4 ? handleDeploy : nextStep}
                            disabled={currentStep === 4 && deploying}
                            className="group flex items-center gap-3 px-10 py-4 bg-white text-zinc-950 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {currentStep === 4 && deploying ? (
                                <><span className="animate-spin inline-block w-4 h-4 border-2 border-zinc-700 border-t-zinc-950 rounded-full" /> Deploying...</>
                            ) : (
                                <>{currentStep === 4 ? 'Deploy Property' : 'Next Step'}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyOnboardingEngine;
