import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [loadingCount, setLoadingCount] = useState(0);

    const startLoading = () => setLoadingCount(prev => prev + 1);
    const stopLoading = () => setLoadingCount(prev => Math.max(0, prev - 1));

    const isLoading = loadingCount > 0;

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
