import LogoGold from '../assets/logo-gold.png';
import LogoDarkBg from '../assets/logo-dark-bg.png';
import LogoReport from '../assets/logo-report.png';

export const appConfig = {
    brand: {
        name: 'Compromiso Real',
        tagline: 'Gestión Política Inteligente',
        companyName: 'Compromiso Real S.A.S',
        website: 'https://compromisoreal.com',
        version: '2.0.0'
    },
    assets: {
        mainLogo: LogoGold,      // Used in Login, large displays
        dashboardLogo: LogoDarkBg, // Used in Dark headers (if any)
        sidebarLogo: LogoGold,     // Used in Sidebar (light theme)
        reportLogo: LogoReport,    // Used in PDF Reports
        favicon: '/favicon.ico'
    },
    theme: {
        primaryColor: '#3b82f6', // Tailwind blue-500
        secondaryColor: '#64748b' // Tailwind slate-500
    },
    organization: {
        address: 'Calle 123 # 45-67',
        city: 'Ibagué, Tolima',
        phone: '+57 300 123 4567',
        email: 'contacto@compromisoreal.com'
    }
};

export type AppConfig = typeof appConfig;
