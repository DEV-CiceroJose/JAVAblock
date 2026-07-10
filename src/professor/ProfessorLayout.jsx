import { NavLink } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';

const NAV_ITEMS = [
  { to: '/professor/desafios', label: 'Desafios' },
  { to: '/professor/dashboard', label: 'Dashboard' },
  { to: '/professor/config', label: 'Configurações' }
];

export default function ProfessorLayout({ children }) {
  const { logout } = useProfessorAuth();

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 flex flex-col sm:flex-row">
      <aside className="sm:w-56 sm:shrink-0 sm:min-h-screen bg-base-panel border-b sm:border-b-0 sm:border-r border-base-border flex flex-col">
        <div className="px-5 py-5 border-b border-base-border">
          <span className="text-xs uppercase tracking-wide text-slate-500">JavaBlocks</span>
          <h1 className="text-lg font-bold text-adminAccent">Painel do Professor</h1>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-adminAccent/15 text-adminAccent'
                    : 'text-slate-300 hover:bg-base-bg hover:text-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-base-border">
          <button
            type="button"
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-base-bg transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
