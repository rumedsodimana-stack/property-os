import React from 'react';
import { Rocket, ShieldCheck, Info, BarChart3, Home } from 'lucide-react';
import { OnboardingData } from '../PropertyOnboardingEngine';

interface ReviewStepProps {
    data: OnboardingData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
    const totalPotentialRevenue = data.rooms.reduce((acc, room) => {
        const cat = data.categories.find(c => c.id === room.categoryId);
        return acc + (cat?.baseRate || 0);
    }, 0);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Step 4: Final Deployment</h2>
                <p className="text-zinc-500 mt-2 font-medium">Your property is ready to go live. Review the orchestration summary below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                            <Home size={24} />
                        </div>
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Infrastructure</h3>
                    </div>
                    <div className="space-y-1">
                        <span className="text-4xl font-black text-white">{data.rooms.length}</span>
                        <p className="text-zinc-500 font-bold text-xs uppercase">Total Units across {data.floors.length} Floors</p>
                    </div>
                </div>

                <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Price Potential</h3>
                    </div>
                    <div className="space-y-1">
                        <span className="text-4xl font-black text-emerald-400">${totalPotentialRevenue}</span>
                        <p className="text-zinc-500 font-bold text-xs uppercase">Daily Inventory Value</p>
                    </div>
                </div>

                <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Logical DNA</h3>
                    </div>
                    <div className="space-y-1">
                        <span className="text-4xl font-black text-white">{data.categories.length}</span>
                        <p className="text-zinc-500 font-bold text-xs uppercase">Master Room Categories</p>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 text-indigo-500/10">
                    <Rocket size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">Ready for Commissioning?</h3>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                            Clicking "Deploy Property" will synchronize these definitions with the core RoomService. All existing mock data will be archived, and your new inventory will become available for Stay Allocation in the Front Desk immediately.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-zinc-950/50 border border-zinc-900 rounded-2xl flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                <Info size={14} className="text-zinc-700" />
                This operation is irreversible. Ensure all numbering patterns and base rates are accurate.
            </div>
        </div>
    );
};

export default ReviewStep;
