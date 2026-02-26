import React from 'react';
import { ConnectionType } from '../../services/intelligence/documentGraphService';
import { connectionTypeConfig } from '../../services/intelligence/documentGraphConfig';

interface ConnectionLineProps {
    from: { x: number; y: number };
    to: { x: number; y: number };
    type: ConnectionType;
    strength: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, type, strength }) => {
    const config = connectionTypeConfig[type];

    // Calculate curve control points for smooth bezier curve
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const offset = Math.min(Math.sqrt(dx * dx + dy * dy) / 3, 100);

    // Control point offset perpendicular to the line
    const controlX = midX + dy / Math.sqrt(dx * dx + dy * dy) * offset;
    const controlY = midY - dx / Math.sqrt(dx * dx + dy * dy) * offset;

    // Create curved path
    const pathD = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

    // Different styles based on connection type
    const getStrokeDasharray = () => {
        switch (config.style) {
            case 'dashed':
                return '8 4';
            case 'dotted':
                return '2 4';
            case 'solid':
            case 'curved':
            case 'arrow':
            default:
                return 'none';
        }
    };

    const lineWidth = config.width * strength;

    return (
        <g className="connection-line">
            {/* Glow effect */}
            <path
                d={pathD}
                fill="none"
                stroke={config.color}
                strokeWidth={lineWidth + 2}
                strokeDasharray={getStrokeDasharray()}
                opacity={0.2}
                className="blur-sm"
            />

            {/* Main line */}
            <path
                d={pathD}
                fill="none"
                stroke={config.color}
                strokeWidth={lineWidth}
                strokeDasharray={getStrokeDasharray()}
                opacity={0.6}
                strokeLinecap="round"
            />

            {/* Animated flow particles (for transclusion and dependency) */}
            {(type === 'transclude' || type === 'dependency') && (
                <>
                    <circle r="3" fill={config.color} opacity="0.8">
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            path={pathD}
                        />
                    </circle>
                    <circle r="3" fill={config.color} opacity="0.8">
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            path={pathD}
                            begin="1s"
                        />
                    </circle>
                </>
            )}

            {/* Arrow head for 'supersedes' type */}
            {type === 'supersedes' && (
                <defs>
                    <marker
                        id={`arrow-${type}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L0,6 L9,3 z"
                            fill={config.color}
                        />
                    </marker>
                </defs>
            )}
            {type === 'supersedes' && (
                <path
                    d={pathD}
                    fill="none"
                    stroke={config.color}
                    strokeWidth={lineWidth}
                    markerEnd={`url(#arrow-${type})`}
                    opacity={0.6}
                />
            )}
        </g>
    );
};

export default ConnectionLine;
