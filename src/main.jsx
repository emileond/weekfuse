import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Get the stored theme from localStorage
const storedTheme = localStorage.getItem('heroui-theme');

if (!storedTheme) {
    localStorage.setItem('heroui-theme', 'light');
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <HeroUIProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </HeroUIProvider>
    </StrictMode>,
);
