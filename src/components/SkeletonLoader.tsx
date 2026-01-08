interface SkeletonLoaderProps {
    type?: 'card' | 'table' | 'text' | 'kpi';
    count?: number;
}

export default function SkeletonLoader({ type = 'text', count = 1 }: SkeletonLoaderProps) {
    const renderSkeleton = () => {
        switch (type) {
            case 'kpi':
                return (
                    <div className="skeleton-kpi-grid">
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="skeleton-item skeleton-kpi-card"></div>
                        ))}
                    </div>
                );
            case 'table':
                return (
                    <div className="skeleton-table">
                        <div className="skeleton-item skeleton-table-header"></div>
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="skeleton-item skeleton-table-row"></div>
                        ))}
                    </div>
                );
            case 'card':
                return (
                    <div className="skeleton-card-grid">
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="skeleton-item skeleton-card"></div>
                        ))}
                    </div>
                );
            default:
                return (
                    <div className="skeleton-text-container">
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="skeleton-item skeleton-text"></div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="skeleton-loader">
            {renderSkeleton()}
        </div>
    );
}
