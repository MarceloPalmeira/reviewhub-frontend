import { Clapperboard, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { Product, User } from '../api';
import { Avatar, Dropdown, domains } from './ui';

export function Header({
  product,
  user,
  onLogout,
}: { product: Product; user: User | null; onLogout: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const BrandIcon =
    product.domains.length === 1
      ? domains[product.domains[0]]?.icon || Clapperboard
      : Clapperboard;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <BrandIcon size={19} />
          </span>
          <span>{product.name}</span>
        </Link>
        <nav className="main-nav" aria-label="Navegação principal">
          <NavLink to="/catalogo">Catálogo</NavLink>
          {user && product.features.includes('social_feed') && (
            <NavLink to="/feed">Feed</NavLink>
          )}
          {user && product.features.includes('custom_lists') && (
            <NavLink to="/listas">Minhas listas</NavLink>
          )}
        </nav>
        <div className="header-actions">
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/catalogo?q=${encodeURIComponent(query)}`);
            }}
          >
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar no catálogo"
              placeholder="Buscar no catálogo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="sr-only">
              Buscar
            </button>
          </form>
          <Link
            className="mobile-search"
            to="/catalogo"
            aria-label="Buscar no catálogo"
          >
            <Search size={19} />
          </Link>
          {user ? (
            <div className="account-actions">
              <Link
                className="account-link"
                aria-label="Meu perfil"
                to={`/perfil/${user.id}`}
              >
                <Avatar name={user.display_name} />
                <span>Meu perfil</span>
              </Link>
              <button
                className="logout-button"
                type="button"
                onClick={onLogout}
              >
                Sair
              </button>
              <Dropdown
                label="Menu do usuário"
                trigger={<Avatar name={user.display_name} />}
              >
                <Link to={`/perfil/${user.id}`}>Meu perfil</Link>
                <button type="button" onClick={onLogout}>
                  Sair
                </button>
              </Dropdown>
            </div>
          ) : (
            <div className="account-actions">
              <Link className="login-link" to="/entrar">
                Entrar
              </Link>
              <Link className="button button-small" to="/cadastro">
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
      <nav className="domain-nav" aria-label="Explorar por domínio">
        <div className="domain-nav-inner">
          <span>EXPLORAR</span>
          {product.domains.map((domain) => {
            const entry = domains[domain];
            if (!entry) return null;
            const Icon = entry.icon;
            return (
              <Link key={domain} to={`/catalogo?domain=${domain}`}>
                <Icon size={15} />
                {entry.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
