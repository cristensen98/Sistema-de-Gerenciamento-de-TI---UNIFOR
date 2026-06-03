import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  systemName: string;
  setSystemName: (name: string) => void;
  systemNameFontSize: number;
  setSystemNameFontSize: (size: number) => void;
  systemNameTextColor: string;
  setSystemNameTextColor: (color: string) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const saved = localStorage.getItem('primaryColor');
    return saved || '#4f46e5'; // Padrão indigo-600
  });

  const [systemName, setSystemName] = useState(() => {
    const saved = localStorage.getItem('systemName');
    return saved || 'Sistema Integrado de Suporte de TI';
  });

  const [systemNameFontSize, setSystemNameFontSize] = useState(() => {
    const saved = localStorage.getItem('systemNameFontSize');
    return saved ? parseInt(saved, 10) : 20;
  });

  const [systemNameTextColor, setSystemNameTextColor] = useState(() => {
    const saved = localStorage.getItem('systemNameTextColor');
    return saved || '#ffffff';
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('logoUrl');
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    const r = parseInt(primaryColor.slice(1, 3), 16);
    const g = parseInt(primaryColor.slice(3, 5), 16);
    const b = parseInt(primaryColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('systemName', systemName);
  }, [systemName]);

  useEffect(() => {
    localStorage.setItem('systemNameFontSize', systemNameFontSize.toString());
  }, [systemNameFontSize]);

  useEffect(() => {
    localStorage.setItem('systemNameTextColor', systemNameTextColor);
  }, [systemNameTextColor]);

  useEffect(() => {
    if (logoUrl) {
      localStorage.setItem('logoUrl', logoUrl);
    } else {
      localStorage.removeItem('logoUrl');
    }
  }, [logoUrl]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      primaryColor, 
      setPrimaryColor,
      systemName,
      setSystemName,
      systemNameFontSize,
      setSystemNameFontSize,
      systemNameTextColor,
      setSystemNameTextColor,
      logoUrl,
      setLogoUrl
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
