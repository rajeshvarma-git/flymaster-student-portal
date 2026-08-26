import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, MessageCircle, GraduationCap, User, Plane } from 'lucide-react';

export function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show on auth page
  if (location.pathname === '/auth') return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: Plane, label: 'Travel', path: '/travel' },
    { icon: GraduationCap, label: 'Universities', path: '/universities' },
    ...(user ? [{ icon: User, label: 'Profile', path: '/dashboard' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border/20 md:hidden shadow-lg safe-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}