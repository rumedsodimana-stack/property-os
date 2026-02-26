
import React from 'react';
import { useInspector, InspectorType } from '../../context/InspectorContext';

interface InspectableProps {
    type: InspectorType;
    id: string;
    children: React.ReactNode;
    className?: string;
    showIcon?: boolean;
}

const Inspectable: React.FC<InspectableProps> = ({ type, id, children, className = '', showIcon = false }) => {
    const { inspect } = useInspector();

    if (!id) return <>{children}</>;

    return (
        <span
            onClick={(e) => {
                e.stopPropagation();
                inspect(type, id);
            }}
            className={`
        cursor-pointer 
        transition-all 
        duration-200 
        hover:text-violet-400 
        hover:underline 
        decoration-violet-500/50 
        underline-offset-4
        inline-flex
        items-center
        gap-1
        ${className}
      `}
            title={`View ${type} profile`}
        >
            {children}
            {showIcon && (
                <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            )}
        </span>
    );
};

export default Inspectable;
