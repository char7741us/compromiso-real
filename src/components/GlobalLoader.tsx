import { useLoading } from '../context/LoadingContext';

export default function GlobalLoader() {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="global-loader-container">
            <div className="global-loader-bar"></div>
            <style>{`
                .global-loader-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    z-index: 9999;
                    pointer-events: none;
                }
                .global-loader-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #60a5fa);
                    width: 100%;
                    animation: global-loading 1.5s infinite linear;
                    transform-origin: 0% 50%;
                }
                @keyframes global-loading {
                    0% {
                        transform: translateX(0) scaleX(0);
                    }
                    40% {
                        transform: translateX(0) scaleX(0.4);
                    }
                    100% {
                        transform: translateX(100%) scaleX(0.5);
                    }
                }
            `}</style>
        </div>
    );
}
