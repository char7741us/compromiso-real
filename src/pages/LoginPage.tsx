import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { SecurityGuard } from '../utils/SecurityGuard';
import { toast } from 'react-hot-toast';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Check if already logged in
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/admin/dashboard');
        });
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Layer 1: Honeypot (Bot Detection)
        if (SecurityGuard.isBot(honeypot)) {
            console.warn('Bot detected via honeypot.');
            toast.error('Acceso denegado.');
            return;
        }

        // Layer 2: Rate Limiting
        if (!SecurityGuard.rateLimit(email)) {
            toast.error('Demasiados intentos. Por favor, espere un minuto.');
            return;
        }

        setIsSubmitting(true);

        // Layer 3: Sanitization
        const sanitizedEmail = SecurityGuard.sanitize(email);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: sanitizedEmail,
                password: password,
            });

            if (error) {
                throw error;
            }

            toast.success('¡Bienvenido de nuevo!');
            navigate('/admin/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card glass-effect">
                <div className="login-brand-section">
                    <img
                        src="/assets/official_logo.png"
                        alt="Compromiso Real Logo"
                        className="login-logo-img"
                    />
                    <h1 className="login-title">Acceso Administrativo</h1>
                    <p className="login-subtitle">Plataforma de Gestión Territorial</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {/* Honeypot field (hidden from users) */}
                    <div className="hidden-honeypot" aria-hidden="true">
                        <input
                            type="text"
                            name="website_url"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>

                    <div className="security-badge">
                        <span className="icon-shield"></span>
                        Protección Anti-Hackeo Activa
                    </div>
                </form>
            </div>

            <div className="login-bg-decoration">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="login-footer">
                Creado por <a href="https://jkcharry.com" target="_blank" rel="noopener noreferrer">Johan Charry</a>
            </div>
        </div>
    );
};

export default LoginPage;
