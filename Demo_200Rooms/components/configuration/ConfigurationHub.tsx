import React, { useState } from 'react';
import { LayoutDashboard, Brain, Bed, Store, Shield, Menu, Building2, TrendingUp, Globe, CreditCard, Cpu, GitMerge } from 'lucide-react';
import SystemDashboard from './SystemDashboard';
import AISettings from './AISettings';
import PropertyOnboardingEngine from './rooms/PropertyOnboardingEngine';
import POSSettings from './POSSettings';
import PermissionSettings from './PermissionSettings';
import PropertyProfile from './property/PropertyProfile';
import RevenueConfig from './RevenueConfig';
import OTAChannelsConfig from './OTAChannelsConfig';
import FinancialConfig from './financial/FinancialConfig';
import HardwareCommandCenter from './hardware/HardwareCommandCenter';
import WorkflowApprovals from './WorkflowApprovals';
import AppearanceSettings from './AppearanceSettings';

const ConfigurationHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'property' | 'financial' | 'hardware' | 'ai' | 'rooms' | 'pos' | 'permissions' | 'revenue' | 'ota_channels' | 'workflow_approvals' | 'appearance'>('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <SystemDashboard />;
            case 'property': return <PropertyProfile />;
            case 'financial': return <FinancialConfig />;
            case 'hardware': return <HardwareCommandCenter />;
            case 'ai': return <AISettings />;
            case 'rooms': return <PropertyOnboardingEngine />;
            case 'revenue': return <RevenueConfig />;
            case 'pos': return <POSSettings />;
            case 'permissions': return <PermissionSettings />;
            case 'ota_channels': return <OTAChannelsConfig />;
            case 'workflow_approvals': return <WorkflowApprovals />;
            case 'appearance': return <AppearanceSettings />;
            default: return <SystemDashboard />;
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'System Dashboard', icon: LayoutDashboard },
        { id: 'property', label: 'Property Profile', icon: Building2 },
        { id: 'financial', label: 'Financial & Payments', icon: CreditCard },
        { id: 'hardware', label: 'Hardware & IoT Devices', icon: Cpu },
        { id: 'revenue', label: 'Revenue & Rates', icon: TrendingUp },
        { id: 'ai', label: 'AI Configuration', icon: Brain },
        { id: 'rooms', label: 'Room Configuration', icon: Bed },
        { id: 'pos', label: 'POS Settings', icon: Store },
        { id: 'permissions', label: 'Permissions & Roles', icon: Shield },
        { id: 'workflow_approvals', label: 'Workflow Approvals', icon: GitMerge },
        { id: 'ota_channels', label: 'OTA & Distribution', icon: Globe },
        { id: 'appearance', label: 'Appearance', icon: Globe }, // Reusing Globe or monitor, actually let's use LayoutDashboard since Monitor isn't imported from lucide
    ];

    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
            {/* Configuration Sidebar */}
            <div className="w-64 border-r border-zinc-900 bg-zinc-950/50 flex flex-col">
                <div className="p-6 border-b border-zinc-900">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Menu size={24} className="text-violet-500" />
                        Configuration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">System Control Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-900">
                    <div className="text-xs text-zinc-600 text-center">
                        v2.4.0 • Hotel Singularity OS
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-sm">
                    <h1 className="text-lg font-semibold text-white">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ConfigurationHub;
