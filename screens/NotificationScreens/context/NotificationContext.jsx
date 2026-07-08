import React, { createContext, useContext, useState, useMemo } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [activeType, setActiveType] = useState('all');

    const value = useMemo(
        () => ({
            activeType,
            setActiveType,
        }),
        [activeType]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// ✅ Custom hook to consume context
export const useNotificationContext = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error(
            'useNotificationContext must be used inside NotificationProvider'
        );
    }
    return ctx;
};