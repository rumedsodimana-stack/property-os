import React from 'react';
import { PosOrder } from '../../types';
import KDS from './KDS';

interface BarDisplayProps {
    orders: PosOrder[];
}

const BarDisplay: React.FC<BarDisplayProps> = ({ orders }) => {
    const handleCompleteOrder = (orderId: string) => {
        // Mark order as ready
        console.log('Order completed:', orderId);
    };

    return (
        <KDS
            orders={orders}
            onCompleteOrder={handleCompleteOrder}
            isBar={true}
        />
    );
};

export default BarDisplay;
