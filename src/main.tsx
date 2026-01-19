import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Production Cleanup: Disable logs in production
if (import.meta.env.PROD) {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
