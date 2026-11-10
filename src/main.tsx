import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Compass, Plus, Search, Sparkles } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { z } from 'zod';
import { ExternalSearch } from './ExternalSearch';
import { AddToList, ListDetails, ListsPage } from './Lists';
import { ReviewCard } from './ReviewCard';
import { Feed, ProfileSocial } from './Social';
import {
  type Content,
  type Product,
  type Review,
  type User,
  api,
  message,
} from './api';
import { Header } from './components/Header';
import {
  Avatar,
  Badge,
  ConfirmDialog,
  ContentCard,
  EmptyState,
  Input,
  LoadingSkeleton,
  Pagination,
  Poster,
  RatingDisplay,
  RatingInput,
  Tabs,
  Textarea,
  Toast,
  domains,
} from './components/ui';
import { type ReviewStats, useReviewStats } from './hooks/useReviewStats';
import './style.css';

function textOnAccent(hex: string) {
  const channels = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.183 ? '#0c0e14' : '#ffffff';
}

function NotFound() {
  return (
    <section className="not-found">
      <span className="section-kicker">ERRO 404</span>
      <h1>Essa história não está aqui.</h1>
      <p>
        A página que você procura não existe ou não está disponível neste
        produto.
      </p>
      <Link className="button" to="/">
        Voltar ao início <ArrowRight size={16} />
      </Link>
    </section>
  );
}

export function App() {
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/product.json')
      .then((r) => setProduct(r.data))
      .catch(() =>
        setError('Não foi possível carregar a configuração do produto.'),
      );
    const expired = () => {
      setUser(null);
      setError('Sessão expirada. Entre novamente.');
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  if (!product) return <main>{error || 'Carregando produto...'}</main>;
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return (
    <div
      className="app-shell"
      style={
        {
          '--accent': product.color,
          '--on-accent': textOnAccent(product.color),
        } as React.CSSProperties
      }
    >
      <Header product={product} user={user} onLogout={logout} />
      {error && <p className="notice">{error}</p>}
      <main>
        <Routes>
          <Route path="/" element={<Home product={product} user={user} />} />
          <Route
            path="/catalogo"
            element={<Catalog product={product} user={user} />}
          />
          <Route
            path="/conteudo/:id"
            element={<Details user={user} product={product} />}
          />
          <Route path="/entrar" element={<Auth onLogin={setUser} />} />
          <Route
            path="/cadastro"
            element={<Auth register onLogin={setUser} />}
          />
          <Route
            path="/perfil/:id"
            element={<Profile user={user} product={product} />}
          />
          <Route
            path="/listas"
            element={
              product.features.includes('custom_lists') ? (
                user ? (
                  <ListsPage />
                ) : (
                  <Navigate to="/entrar" replace />
                )
              ) : (
                <NotFound />
              )
            }
          />
          <Route
            path="/listas/:id"
            element={
              product.features.includes('custom_lists') ? (
                user ? (
                  <ListDetails />
                ) : (
                  <Navigate to="/entrar" replace />
                )
              ) : (
                <NotFound />
              )
            }
          />
          <Route
            path="/feed"
            element={
              product.features.includes('social_feed') ? (
                user ? (
                  <Feed user={user} product={product} />
                ) : (
                  <Navigate to="/entrar" replace />
                )
              ) : (
                <NotFound />
              )
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {product.features.includes('external_tmdb') && (
        <section className="provider-credits" aria-label="Créditos de fontes">
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          </a>
          <span>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </span>
        </section>
      )}
      <footer className="site-footer">
        <span>✳ &nbsp;{product.name}</span>
        <span>Boas histórias merecem ser compartilhadas.</span>
        <span>Feito para quem sente a cultura.</span>
      </footer>
    </div>
  );
}
function Home({ product, user }: { product: Product; user: User | null }) {
  const [items, setItems] = useState<Content[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const stats = useReviewStats(items);
  const wellRated =
    items
      ?.slice(0, 5)
      .filter(
        (item) =>
          (stats[item.id]?.count || 0) > 0 &&
          (stats[item.id]?.average || 0) >= 4,
      ) || [];
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/api/v1/contents'), api.get('/api/v1/reviews')])
      .then(([a, b]) => {
        setItems(a.data);
        setReviews(b.data);
      })
      .catch((e) => setError(message(e)));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> SEU ESPAÇO PARA DESCOBRIR
          </div>
          <h1>
            Uma boa história <em>fica com você.</em>
          </h1>
          <p>
            Descubra novos favoritos e compartilhe o que vale a pena em{' '}
            {product.domains
              .map((d) => domains[d]?.label.toLowerCase() || d)
              .join(', ')}
            .
          </p>
          <div className="hero-actions">
            <Link className="button" to="/catalogo">
              Explorar catálogo <ArrowRight size={16} />
            </Link>
            {!user && (
              <Link className="text-link" to="/cadastro">
                Faça parte da conversa <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-orbit art-orbit-one" />
          <span className="art-orbit art-orbit-two" />
          <span className="art-cross art-cross-one">✳</span>
          <span className="art-cross art-cross-two">✧</span>
          <span className="art-disc">
            <span>
              {product.name.charAt(0).toUpperCase()}
              <span>✳</span>H
            </span>
          </span>
          <span className="art-label art-label-top">
            CULTURA EM TODAS AS FORMAS
          </span>
          <span className="art-label art-label-bottom">
            DESCOBRIR · AVALIAR · COMPARTILHAR
          </span>
        </div>
      </section>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <section className="discover-strip">
        <div>
          <span className="section-kicker">ENCONTRE SEU UNIVERSO</span>
          <h2>Explore por categoria</h2>
        </div>
        <div className="category-links">
          {product.domains.map((domain) => {
            const entry = domains[domain];
            if (!entry) return null;
            const Icon = entry.icon;
            return (
              <Link key={domain} to={`/catalogo?domain=${domain}`}>
                <Icon size={18} />
                {entry.label}
                <ArrowRight size={14} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">PARA DESCOBRIR</span>
            <h2>Novidades no catálogo</h2>
            <p>Histórias e experiências para sua próxima descoberta.</p>
          </div>
          <Link className="section-link" to="/catalogo">
            Ver catálogo <ArrowRight size={15} />
          </Link>
        </div>
        {items === null ? (
          <LoadingSkeleton />
        ) : (
          <Cards items={items.slice(0, 5)} stats={stats} />
        )}
      </section>
      {wellRated && wellRated.length > 0 && (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">ESCOLHAS DA COMUNIDADE</span>
              <h2>Bem avaliados</h2>
              <p>Entre as novidades, conteúdos com média a partir de 4.</p>
            </div>
          </div>
          <Cards items={wellRated} stats={stats} />
        </section>
      )}
      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">DA COMUNIDADE</span>
            <h2>O que estão dizendo</h2>
            <p>Opiniões recentes de quem viveu cada história.</p>
          </div>
        </div>
        {reviews === null ? (
          <output className="panel skeleton-review">
            Carregando reviews...
          </output>
        ) : reviews.length ? (
          <div className="review-list">
            {reviews.slice(0, 4).map((r) => (
              <ReviewCard key={r.id} review={r} user={user} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title="A conversa começa com você">
            Explore o catálogo e compartilhe sua primeira opinião.
          </EmptyState>
        )}
      </section>
    </>
  );
}
function Cards({
  items,
  stats,
}: { items: Content[]; stats: Record<string, ReviewStats> }) {
  return items.length ? (
    <div className="grid">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} stats={stats[item.id]} />
      ))}
    </div>
  ) : (
    <EmptyState title="Nenhum conteúdo encontrado">
      Tente outra busca ou explore uma categoria diferente.
    </EmptyState>
  );
}
function Catalog({ product, user }: { product: Product; user: User | null }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const domain = params.get('domain') || '';
  const [items, setItems] = useState<Content[] | null>(null);
  const stats = useReviewStats(items);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const changeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };
  useEffect(() => {
    let active = true;
    setItems(null);
    api
      .get('/api/v1/contents', {
        params: { q, domain: domain || undefined, page },
      })
      .then((r) => {
        if (active) {
          setItems(r.data);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(message(e));
          setItems([]);
        }
      });
    return () => {
      active = false;
    };
  }, [q, domain, page]);
  return (
    <>
      <div className="page-intro">
        <span className="section-kicker">
          <Compass size={14} /> EXPLORE À VONTADE
        </span>
        <h1>
          Seu próximo favorito
          <br />
          <em>está por aqui.</em>
        </h1>
        <p>
          Descubra histórias, encontre experiências e compartilhe sua opinião.
        </p>
      </div>
      <section className="content-section catalog-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">DESCUBRA ALGO NOVO</span>
            <h2>Explorar catálogo</h2>
          </div>
        </div>
        <div className="filters">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Pesquisar título"
              placeholder="Pesquisar por título..."
              value={q}
              onChange={(e) => changeFilter('q', e.target.value)}
            />
          </div>
          <select
            aria-label="Domínio"
            value={domain}
            onChange={(e) => changeFilter('domain', e.target.value)}
          >
            <option value="">Todos os domínios</option>
            {product.domains.map((d) => (
              <option key={d} value={d}>
                {domains[d]?.label || d}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <ExternalSearch
          key={`${domain}:${q}`}
          product={product}
          user={user}
          domain={domain}
          query={q}
        />
        {items === null ? (
          <LoadingSkeleton count={5} />
        ) : (
          <>
            <Cards items={items} stats={stats} />
            <Pagination
              page={page}
              next={items.length >= 12}
              onPage={setPage}
            />
          </>
        )}
      </section>
    </>
  );
}
const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  display_name: z.string().optional(),
  email: z.string().optional(),
  confirm: z.string().optional(),
});
type AuthFields = z.infer<typeof authSchema>;
function Auth({
  register: isRegister = false,
  onLogin,
}: { register?: boolean; onLogin: (u: User) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFields>({ resolver: zodResolver(authSchema) });
  const submit = async (data: AuthFields) => {
    try {
      if (isRegister) {
        if (
          !data.display_name ||
          !z.string().email().safeParse(data.email).success ||
          data.password !== data.confirm
        ) {
          setError('Confira nome, e-mail e confirmação de senha.');
          return;
        }
        await api.post('/api/v1/auth/register', {
          username: data.username,
          password: data.password,
          display_name: data.display_name,
          email: data.email,
        });
      }
      const response = await api.post('/api/v1/auth/login', {
        username: data.username,
        password: data.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
      navigate('/');
    } catch (e) {
      setError(message(e));
    }
  };
  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <span className="section-kicker">BEM-VINDO À COMUNIDADE</span>
        <h2>
          Uma opinião pode abrir <em>um novo mundo.</em>
        </h2>
        <p>
          Encontre suas próximas histórias favoritas e compartilhe as que
          ficaram com você.
        </p>
        <div className="auth-art">✳</div>
      </aside>
      <form className="panel form auth-form" onSubmit={handleSubmit(submit)}>
        <span className="section-kicker">
          {isRegister ? 'COMECE SUA JORNADA' : 'BOM TER VOCÊ DE VOLTA'}
        </span>
        <h1>{isRegister ? 'Criar conta' : 'Entrar'}</h1>
        <p>
          {isRegister
            ? 'Seu espaço para descobrir e compartilhar.'
            : 'Entre e continue de onde parou.'}
        </p>
        {error && <p role="alert">{error}</p>}
        <label>
          Usuário
          <input {...register('username')} />
        </label>
        {errors.username && <small>Mínimo de 3 caracteres</small>}
        {isRegister && (
          <>
            <label>
              Nome de exibição
              <input {...register('display_name')} />
            </label>
            <label>
              E-mail
              <input type="email" {...register('email')} />
            </label>
          </>
        )}
        <label>
          Senha
          <input type="password" {...register('password')} />
        </label>
        {errors.password && <small>Mínimo de 8 caracteres</small>}
        {isRegister && (
          <label>
            Confirmar senha
            <input type="password" {...register('confirm')} />
          </label>
        )}
        <button type="submit">{isRegister ? 'Cadastrar' : 'Entrar'}</button>
        <p className="auth-switch">
          {isRegister ? (
            <>
              Já tem uma conta? <Link to="/entrar">Entrar</Link>
            </>
          ) : (
            <>
              Ainda não tem uma conta? <Link to="/cadastro">Criar conta</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
const reviewSchema = z.object({
  rating: z.number().min(0).max(5).multipleOf(0.5),
  title: z.string().max(200),
  text: z.string().trim().min(1),
  spoiler: z.boolean(),
});
type ReviewFields = z.infer<typeof reviewSchema>;
function Details({ user, product }: { user: User | null; product: Product }) {
  const { id } = useParams();
  const [item, setItem] = useState<Content | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ count: number; average: number | null }>(
    { count: 0, average: null },
  );
  const [error, setError] = useState('');
  const [own, setOwn] = useState<Review | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFields>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: '', text: '', spoiler: false },
  });
  const load = useCallback(
    () =>
      Promise.all([
        api.get(`/api/v1/contents/${id}`),
        api.get('/api/v1/reviews', { params: { content_id: id } }),
        api.get('/api/v1/reviews/stats', { params: { content_id: id } }),
        user
          ? api.get('/api/v1/reviews', {
              params: { content_id: id, author_id: user.id },
            })
          : Promise.resolve({ data: [] }),
      ])
        .then(([a, b, c, ownReviews]) => {
          setItem(a.data);
          setReviews(b.data);
          setStats(c.data);
          setOwn(ownReviews.data[0] || null);
        })
        .catch((e) => setError(message(e))),
    [id, user],
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    reset(
      own
        ? {
            rating: own.rating,
            title: own.title || '',
            text: own.text,
            spoiler: own.spoiler,
          }
        : { rating: 5, title: '', text: '', spoiler: false },
    );
  }, [own, reset]);
  const submit = async (d: ReviewFields) => {
    try {
      if (own) await api.patch(`/api/v1/reviews/${own.id}`, d);
      else await api.post('/api/v1/reviews', { ...d, content_id: id });
      await load();
      setError('Review salva.');
    } catch (e) {
      setError(message(e));
    }
  };
  const remove = async () => {
    if (own)
      try {
        await api.delete(`/api/v1/reviews/${own.id}`);
        await load();
        setError('Review excluída.');
      } catch (e) {
        setError(message(e));
      }
  };
  if (!item)
    return (
      <div className="loading-page">{error || 'Carregando conteúdo...'}</div>
    );
  const labels: Record<string, string> = {
    director: 'Direção',
    duration_minutes: 'Duração',
    cast: 'Elenco',
    year: 'Ano',
    seasons: 'Temporadas',
    episodes: 'Episódios',
    status: 'Status',
    platforms: 'Plataformas',
    developer: 'Desenvolvedora',
    genre: 'Gênero',
    home_team: 'Mandante',
    away_team: 'Visitante',
    home_score: 'Placar mandante',
    away_score: 'Placar visitante',
    competition: 'Campeonato',
    match_date: 'Data',
    artist: 'Artista',
    tracks: 'Faixas',
  };
  const meta = item.metadata;
  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="Excluir review?"
          description="Sua opinião será removida permanentemente."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void remove();
          }}
        />
      )}
      <Link className="back-link" to="/catalogo">
        ← Voltar ao catálogo
      </Link>
      <section
        className={`detail-hero${item.backdrop_url ? ' detail-hero-backdrop' : ''}`}
        style={
          item.backdrop_url
            ? {
                backgroundImage: `linear-gradient(90deg, #12141bed, #12141bc9), url(${JSON.stringify(item.backdrop_url)})`,
              }
            : undefined
        }
      >
        <div className="detail-poster">
          <Poster item={item} />
        </div>
        <div className="detail-content">
          <div className="detail-overline">
            <Badge>{domains[item.domain]?.singular || item.domain}</Badge>
            <span>●</span>
            <span>NO CATÁLOGO</span>
            {item.external_provider && (
              <span>FONTE: {item.external_provider.toUpperCase()}</span>
            )}
          </div>
          <h1>{item.title}</h1>
          <p className="detail-description">
            {item.description || 'Uma história esperando para ser descoberta.'}
          </p>
          {item.domain === 'football_matches' &&
          meta.home_team &&
          meta.away_team ? (
            <div className="scoreboard">
              <strong>{String(meta.home_team)}</strong>
              {meta.home_score !== undefined &&
                meta.away_score !== undefined && (
                  <span>
                    {String(meta.home_score)} <small>×</small>{' '}
                    {String(meta.away_score)}
                  </span>
                )}
              <strong>{String(meta.away_team)}</strong>
            </div>
          ) : null}
          <div className="detail-rating">
            <RatingDisplay rating={stats.average} count={stats.count} />
            <span>·</span>
            <span>Notas da comunidade</span>
          </div>
          <a className="button" href="#review-form">
            <Plus size={16} />
            {own ? 'Editar minha review' : 'Escrever review'}
          </a>
        </div>
      </section>
      <div className="detail-layout">
        <div>
          <section className="content-section detail-reviews">
            <div className="section-heading">
              <div>
                <span className="section-kicker">A CONVERSA</span>
                <h2>
                  Reviews <span className="muted-count">{stats.count}</span>
                </h2>
              </div>
            </div>
            {error &&
              (error.startsWith('Review salva') ||
              error.startsWith('Review excluída') ? (
                <Toast>{error}</Toast>
              ) : (
                <p role="alert" className="notice">
                  {error}
                </p>
              ))}
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    user={user}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Ainda não há reviews">
                Seja a primeira pessoa a compartilhar uma opinião.
              </EmptyState>
            )}
          </section>
          <section id="review-form" className="content-section">
            {user ? (
              <form
                className="panel form review-form"
                onSubmit={handleSubmit(submit)}
              >
                <span className="section-kicker">SUA VEZ DE CONTAR</span>
                <h2>{own ? 'Editar sua review' : 'Escrever review'}</h2>
                <p>O que você achou? Sua opinião faz parte da conversa.</p>
                <div>
                  <span className="field-label">Sua avaliação</span>
                  <RatingInput
                    value={watch('rating')}
                    onChange={(value) =>
                      setValue('rating', value, { shouldValidate: true })
                    }
                  />
                  {errors.rating && <small>Escolha uma nota de 0 a 5.</small>}
                </div>
                <label htmlFor="review-title">
                  Título <span className="optional">opcional</span>
                  <Input
                    id="review-title"
                    aria-label="Título"
                    placeholder="Resuma sua experiência"
                    {...register('title')}
                  />
                </label>
                <label htmlFor="review-text">
                  Review
                  <Textarea
                    id="review-text"
                    placeholder="Conte o que tornou esta experiência especial..."
                    {...register('text')}
                  />
                </label>
                {errors.text && <small>Escreva sua review.</small>}
                {product.features.includes('spoiler_control') && (
                  <label className="checkbox-label">
                    <input type="checkbox" {...register('spoiler')} /> Contém
                    spoiler
                  </label>
                )}
                <div className="form-actions">
                  <button type="submit">
                    Salvar review <ArrowRight size={15} />
                  </button>
                  {own && (
                    <button
                      className="button-quiet danger"
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Excluir review
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="panel review-cta">
                <h2>Tem algo a dizer?</h2>
                <p>Entre para compartilhar sua opinião com a comunidade.</p>
                <Link className="button" to="/entrar">
                  Entrar para avaliar <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>
        </div>
        <aside className="detail-aside">
          <div className="panel metadata-panel">
            <span className="section-kicker">SOBRE O CONTEÚDO</span>
            <h2>Detalhes</h2>
            {item.genres && item.genres.length > 0 && (
              <p>Gêneros: {item.genres.join(', ')}</p>
            )}
            {item.release_date && <p>Data: {item.release_date}</p>}
            <dl>
              {Object.entries(meta).map(([k, v]) => (
                <div key={k}>
                  <dt>{labels[k] || k.replaceAll('_', ' ')}</dt>
                  <dd>
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                    {k === 'duration_minutes' ? ' min' : ''}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {user && product.features.includes('custom_lists') && (
            <AddToList contentId={item.id} />
          )}
        </aside>
      </div>
    </>
  );
}
function Profile({ user, product }: { user: User | null; product: Product }) {
  const { id } = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileTab, setProfileTab] = useState('reviews');
  const [profileLists, setProfileLists] = useState<
    { id: string; name: string; items: Content[] }[] | null
  >(null);
  const [listError, setListError] = useState('');
  const showMyLists =
    user?.id === id && product.features.includes('custom_lists');
  useEffect(() => {
    if (showMyLists) {
      setProfileLists(null);
      setListError('');
      api
        .get('/api/v1/lists')
        .then((r) => {
          setProfileLists(r.data);
          setListError('');
        })
        .catch((e) => setListError(message(e)));
    }
  }, [showMyLists]);
  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/users/${id}`),
      api.get('/api/v1/reviews', { params: { author_id: id } }),
    ])
      .then(([a, b]) => {
        setProfile(a.data);
        setBio(a.data.bio);
        setDisplayName(a.data.display_name);
        setReviews(b.data);
      })
      .catch((e) => setError(message(e)));
  }, [id]);
  if (!profile)
    return (
      <div className="loading-page">{error || 'Carregando perfil...'}</div>
    );
  return (
    <>
      <section className="profile-banner">
        <span className="section-kicker">PERFIL DA COMUNIDADE</span>
        <div className="profile-identity">
          <Avatar name={profile.display_name} size="large" />
          <div>
            <h1>{profile.display_name}</h1>
            <p>@{profile.username}</p>
          </div>
        </div>
        <p className="profile-bio">
          {profile.bio ||
            'Ainda sem biografia. Cada história começa em algum lugar.'}
        </p>
        {product.features.includes('user_follows') && (
          <ProfileSocial profileId={profile.id} user={user} />
        )}
      </section>
      <div className="profile-layout">
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">ATIVIDADE</span>
              <h2>
                {profileTab === 'lists' && showMyLists
                  ? 'Listas salvas'
                  : 'Reviews recentes'}
              </h2>
            </div>
          </div>
          {user?.id === id && product.features.includes('custom_lists') && (
            <Tabs
              options={[
                { id: 'reviews', label: 'Reviews' },
                { id: 'lists', label: 'Listas' },
              ]}
              value={profileTab}
              onChange={setProfileTab}
            />
          )}
          {profileTab === 'reviews' || !showMyLists ? (
            reviews.length ? (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  user={user}
                  product={product}
                />
              ))
            ) : (
              <EmptyState title="Nenhuma review por aqui">
                As próximas opiniões vão aparecer neste espaço.
              </EmptyState>
            )
          ) : listError ? (
            <p role="alert">{listError}</p>
          ) : profileLists === null ? (
            <p>Carregando listas...</p>
          ) : profileLists.length ? (
            <div className="profile-lists">
              {profileLists.map((list) => (
                <Link
                  className="panel profile-list-card"
                  key={list.id}
                  to={`/listas/${list.id}`}
                >
                  <span className="section-kicker">LISTA PRIVADA</span>
                  <h3>{list.name}</h3>
                  <p>
                    {list.items.length}{' '}
                    {list.items.length === 1 ? 'conteúdo' : 'conteúdos'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma lista criada">
              Comece sua coleção em Minhas listas.
            </EmptyState>
          )}
        </section>
        <aside>
          {user?.id === id && (
            <form
              className="panel form profile-edit"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const r = await api.patch('/api/v1/users/me', {
                    bio,
                    display_name: displayName,
                  });
                  setProfile(r.data);
                  setError('Perfil atualizado.');
                } catch (err) {
                  setError(message(err));
                }
              }}
            >
              <span className="section-kicker">SUA CONTA</span>
              <h2>Editar perfil</h2>
              <label>
                Nome de exibição
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
              </label>
              <button type="submit">Salvar perfil</button>
              {product.features.includes('custom_lists') && (
                <Link className="text-link" to="/listas">
                  Ver minhas listas <ArrowRight size={14} />
                </Link>
              )}
            </form>
          )}
          {error && <output className="notice">{error}</output>}
        </aside>
      </div>
    </>
  );
}
