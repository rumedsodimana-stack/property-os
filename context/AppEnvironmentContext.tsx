import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppEnvironmentContextType {
    activeModule: string;
    setActiveModule: (module: string) => void;
    pageContext: string;
    setPageContext: (context: string) => void;
}

const AppEnvironmentContext = createContext<AppEnvironmentContextType | undefined>(undefined);

export const AppEnvironmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeModule, setActiveModule] = useState<string>('dashboard');
    const [pageContext, setPageContext] = useState<string>('');

    return (
        <AppEnvironmentContext.Provider value={{ activeModule, setActiveModule, pageContext, setPageContext }}>
            {children}
        </AppEnvironmentContext.Provider>
    );
};

export const useAppEnvironment = (): AppEnvironmentContextType => {
    const context = useContext(AppEnvironmentContext);
    if (!context) {
        throw new Error('useAppEnvironment must be used within an AppEnvironmentProvider');
    }
    return context;
};
