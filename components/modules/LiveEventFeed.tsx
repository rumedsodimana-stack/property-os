import React, { useEffect, useState, useRef } from 'react';
import { brandServiceBus, BrandEvent } from '../../services/brand/brandServiceBus';
import { Terminal, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';

const LiveEventFeed: React.FC = () => {
    const [events, setEvents] = useState<BrandEvent[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load initial history
        setEvents(brandServiceBus.getEventHistory(20).reverse());

        // Subscribe to real-time events
        const subscriptionId = brandServiceBus.subscribe(
            'LiveFeed',
            ['all_changes'],
            (event) => {
                setEvents(prev => [...prev.slice(-19), event]); // Keep last 20
            }
        );

        return () => {
            brandServiceBus.unsubscribe(subscriptionId);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [events]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-500';
            case 'high': return 'text-amber-500';
            case 'medium': return 'text-blue-400';
            default: return 'text-zinc-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">System_Log_Stream</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/30 animate-pulse delay-75" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/10 animate-pulse delay-150" />
                    </div>
                </div>
            </div>

            {/* Event Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                {events.length === 0 ? (
                    <div className="text-zinc-600 italic text-center mt-10">Waiting for system events...</div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="group flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Timestamp */}
                            <span className="text-zinc-600 whitespace-nowrap pt-0.5">
                                [{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                            </span>

                            {/* Event Icon Based on Type */}
                            <div className="pt-0.5">
                                {event.priority === 'critical' ? <AlertCircle className="w-3 h-3 text-red-500" /> :
                                    event.type.includes('deployed') ? <CheckCircle className="w-3 h-3 text-emerald-500" /> :
                                        <Activity className="w-3 h-3 text-zinc-500" />}
                            </div>

                            {/* Event Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${getPriorityColor(event.priority)}`}>
                                        {event.type.toUpperCase()}
                                    </span>
                                    {event.source && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                            {event.source}
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-300 truncate opacity-90 group-hover:opacity-100 group-hover:whitespace-normal transition-all text-[11px] mt-0.5">
                                    {JSON.stringify(event.data).replace(/"/g, '')}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Status Footer */}
            <div className="px-3 py-1 bg-zinc-900/50 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono flex justify-between">
                <span>Stream Active</span>
                <span>{events.length} events buffered</span>
            </div>
        </div>
    );
};

export default LiveEventFeed;
