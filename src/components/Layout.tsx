import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  Users, 
  Settings, 
  LogOut, 
  Search,
  Network,
  Monitor,
  Menu,
  X,
  ChevronRight,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../lib/api';
import ViewUserModal from './modals/ViewUserModal';
import ProfileModal from './modals/ProfileModal';
import ViewTicketModal from './modals/ViewTicketModal';
import ViewEquipmentModal from './modals/ViewEquipmentModal';

interface SearchResult {
  id: string;
  type: 'ticket' | 'user' | 'equipment';
  title: string;
  subtitle: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Chamados', path: '/tickets', icon: Ticket },
  { name: 'Novo Chamado', path: '/tickets/new', icon: PlusCircle },
  { name: 'Equipamentos', path: '/equipments', icon: Monitor },
  { name: 'Rede', path: '/network', icon: Network },
  { name: 'Usuários', path: '/users', icon: Users },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { systemName, systemNameFontSize, systemNameTextColor, logoUrl } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsSearching(false);
    setSearchTerm('');
    setSearchResults([]);
    
    if (result.type === 'ticket') {
      setSearchParams({ viewTicket: result.id });
    } else if (result.type === 'user') {
      setSearchParams({ viewUser: result.id });
    } else if (result.type === 'equipment') {
      setSearchParams({ viewEquipment: result.id });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const settingsItem = { name: 'Configurações', path: '/settings', icon: Settings };
  const isSettingsActive = location.pathname === settingsItem.path || location.pathname.startsWith(settingsItem.path);

  const SidebarContent = () => (
    <>
      <div className="min-h-[80px] flex items-center px-6 border-b border-slate-800/50 dark:border-slate-900/50 py-4">
        <div className="flex items-center gap-3 font-bold tracking-tight min-w-0 w-full">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-primary/20">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Ticket className="w-6 h-6 text-white" />
            )}
          </div>
          <span 
            className="font-black flex-1 whitespace-normal break-words leading-tight text-center no-underline not-italic font-sans border-none"
            style={{ 
              fontSize: `${Math.min(Number(systemNameFontSize), 18)}px`, 
              color: systemNameTextColor,
              textAlign: 'center',
              fontFamily: 'system-ui',
              textDecorationLine: 'none',
              fontStyle: 'normal',
              borderWidth: '0px',
              borderStyle: 'none'
            }}
          >
            {systemName}
          </span>
        </div>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems
          .filter(item => {
            if (user?.role === 'Usuário') {
              return !['Usuários', 'Rede', 'Equipamentos'].includes(item.name);
            }
            return true;
          })
          .map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center justify-between group px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                    : "text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white hover:translate-x-1"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {item.name}
                </div>
                {isActive && (
                  <motion.div layoutId="active-nav">
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </motion.div>
                )}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-800/50 dark:border-slate-900/50 space-y-2">
        {user?.role === 'Administrador' && (
          <Link
            to={settingsItem.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
              isSettingsActive 
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white hover:translate-x-1"
            )}
          >
            <settingsItem.icon className="w-5 h-5" />
            {settingsItem.name}
          </Link>
        )}
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold w-full text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 hover:translate-x-1"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900 dark:bg-black text-slate-300 flex-col border-r border-slate-800 dark:border-slate-900 shrink-0 shadow-2xl relative z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 bg-slate-900 dark:bg-black text-slate-300 flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="absolute top-6 right-6 lg:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl lg:hidden transition-all active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar chamados, usuários ou equipamentos..." 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchTerm.length >= 2 && setIsSearching(true)}
                className="w-full pl-12 pr-6 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-slate-200 shadow-inner"
              />

              <AnimatePresence>
                {isSearching && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="max-h-[400px] overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div className={`p-2 rounded-xl ${
                            result.type === 'ticket' ? 'bg-blue-100 text-blue-600' :
                            result.type === 'user' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {result.type === 'ticket' ? <Ticket className="w-4 h-4" /> :
                             result.type === 'user' ? <Users className="w-4 h-4" /> :
                             <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{result.title}</p>
                            <p className="text-xs font-bold text-slate-500 truncate max-w-[300px]">{result.subtitle}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                {isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 text-center z-[100]"
                  >
                    <p className="text-sm font-bold text-slate-500">Nenhum resultado encontrado para "{searchTerm}"</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div 
              className="flex items-center gap-4 pl-1 group cursor-pointer"
              onClick={() => setSearchParams({ viewProfile: user?.id || '' })}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none group-hover:text-primary transition-colors">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mt-1.5">{user?.role || 'Acesso'}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shadow-inner group-hover:scale-105 transition-transform overflow-hidden border border-slate-200 dark:border-slate-800">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userInitials
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300 custom-scrollbar">
          <div className={cn(
            "mx-auto p-6 sm:p-8 lg:p-10 transition-all duration-500",
            location.pathname === '/tickets' ? "max-w-[1600px]" : "max-w-7xl"
          )}>
            <Outlet />
          </div>
        </div>

        {/* Global Modals */}
        {searchParams.get('viewUser') && (
          <ViewUserModal 
            userId={searchParams.get('viewUser')!} 
            onClose={() => {
              searchParams.delete('viewUser');
              setSearchParams(searchParams);
            }} 
          />
        )}
        {searchParams.get('viewProfile') && (
          <ProfileModal 
            userId={searchParams.get('viewProfile')!} 
            onClose={() => {
              searchParams.delete('viewProfile');
              setSearchParams(searchParams);
            }} 
          />
        )}
        {searchParams.get('viewTicket') && (
          <ViewTicketModal 
            ticketId={searchParams.get('viewTicket')!} 
            onClose={() => {
              searchParams.delete('viewTicket');
              setSearchParams(searchParams);
            }} 
          />
        )}
        {searchParams.get('viewEquipment') && (
          <ViewEquipmentModal 
            equipmentId={searchParams.get('viewEquipment')!} 
            onClose={() => {
              searchParams.delete('viewEquipment');
              setSearchParams(searchParams);
            }} 
          />
        )}
      </main>
    </div>
  );
}
