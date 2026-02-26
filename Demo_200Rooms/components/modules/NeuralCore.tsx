import React, { useEffect, useState } from 'react';
import { Brain, Zap, Activity } from 'lucide-react';

interface NeuralCoreProps {
    status: 'idle' | 'scanning' | 'analyzing' | 'learning';
    intensity?: number; // 0-1
}

const NeuralCore: React.FC<NeuralCoreProps> = ({ status, intensity = 0.5 }) => {
    // Dynamic color based on status
    const getStatusColor = () => {
        switch (status) {
            case 'scanning': return 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20';
            case 'analyzing': return 'text-violet-400 border-violet-500/50 shadow-violet-500/20';
            case 'learning': return 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/20';
            default: return 'text-zinc-500 border-zinc-700 shadow-zinc-900/10';
        }
    };

    const getGlowColor = () => {
        switch (status) {
            case 'scanning': return 'rgba(34, 211, 238, 0.4)';
            case 'analyzing': return 'rgba(139, 92, 246, 0.4)';
            case 'learning': return 'rgba(52, 211, 153, 0.4)';
            default: return 'rgba(113, 113, 122, 0.1)';
        }
    };

    return (
        <div className="relative flex items-center justify-center p-8 overflow-hidden rounded-full aspect-square w-full max-w-[200px] mx-auto">
            {/* Outer Pulse Rings */}
            {status !== 'idle' && (
                <>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: getGlowColor(), animationDuration: `${3 - intensity * 2}s` }} />
                    <div className="absolute inset-4 rounded-full animate-pulse opacity-30" style={{ backgroundColor: getGlowColor(), animationDuration: `${2 - intensity}s` }} />
                </>
            )}

            {/* Core Brain Visual */}
            <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full bg-zinc-950/80 backdrop-blur-sm rounded-full border-2 transition-all duration-500 ${getStatusColor()} shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                <div className={`relative ${status !== 'idle' ? 'animate-pulse' : ''}`}>
                    <Brain className={`w-16 h-16 ${status === 'idle' ? 'opacity-50' : 'opacity-100'} transition-all`} />

                    {/* Activity Sparks */}
                    {status === 'analyzing' && (
                        <Zap className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" />
                    )}
                    {status === 'scanning' && (
                        <Activity className="absolute -bottom-2 -left-2 w-6 h-6 text-white animate-spin-slow" />
                    )}
                </div>

                {/* Status Text */}
                <span className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest opacity-80 animate-pulse">
                    {status}
                </span>
            </div>

            {/* Background Mesh Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] z-20 pointer-events-none" />
        </div>
    );
};

export default NeuralCore;
