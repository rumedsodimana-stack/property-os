
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type InspectorType = 'guest' | 'room' | 'reservation' | 'inventory' | 'supplier' | 'event' | 'employee' | 'asset' | 'maintenance_task' | 'visitor' | 'candidate' | 'training_module' | 'transaction';

interface InspectorState {
    isOpen: boolean;
    type: InspectorType | null;
    id: string | null;
}

interface InspectorContextType {
    inspect: (type: InspectorType, id: string) => void;
    closeInspector: () => void;
    state: InspectorState;
}

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export const InspectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<InspectorState>({
        isOpen: false,
        type: null,
        id: null,
    });

    const inspect = (type: InspectorType, id: string) => {
        setState({ isOpen: true, type, id });
    };

    const closeInspector = () => {
        setState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <InspectorContext.Provider value={{ inspect, closeInspector, state }}>
            {children}
        </InspectorContext.Provider>
    );
};

export const useInspector = () => {
    const context = useContext(InspectorContext);
    if (!context) {
        throw new Error('useInspector must be used within an InspectorProvider');
    }
    return context;
};
