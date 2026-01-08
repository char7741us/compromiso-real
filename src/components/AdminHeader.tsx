import React from 'react';
import PlatformLogo from '../assets/logo-compromiso-white.png';

interface AdminHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function AdminHeader({ title, description, children, actions }: AdminHeaderProps) {
    return (
        <div className="admin-header">
            <div className="admin-header-content">
                <div className="flex-between admin-header-top">
                    <div className="admin-header-logo-container">
                        <img
                            src={PlatformLogo}
                            alt="Platform Logo"
                            className="admin-header-logo"
                        />
                    </div>
                    {actions && <div className="admin-header-top-actions">{actions}</div>}
                </div>
                <h2 className="admin-header-title">{title}</h2>
                <div className="admin-header-actions">
                    <p className="admin-header-description">
                        {description}
                    </p>
                    {children}
                </div>
            </div>
        </div>
    );
}
