import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';

interface MicroChartProps {
    data: any[];
    dataKey: string;
    color: string;
    height?: number;
    gradientId: string;
}

const MicroChart: React.FC<MicroChartProps> = ({ data, dataKey, color, height = 40, gradientId }) => {
    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(9, 9, 11, 0.9)',
                            border: '1px solid rgba(39, 39, 42, 1)',
                            borderRadius: '8px',
                            fontSize: '10px',
                            padding: '4px 8px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: color, strokeWidth: 1, opacity: 0.5 }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fill={`url(#${gradientId})`}
                        strokeWidth={2}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MicroChart;
