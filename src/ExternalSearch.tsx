import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type Content, type Product, type User, api, message } from './api';
import { Poster, domains } from './components/ui';

type ExternalItem = Omit<Content, 'id'> & {
  provider: string;
  external_id: string;
  backdrop_url?: string | null;
  genres?: string[];
};
const features: Record<string, string> = {
  movies: 'external_tmdb',
  series: 'external_tmdb',
  video_games: 'external_igdb',
  music_albums: 'external_musicbrainz',
  football_matches: 'external_football',
};

export function ExternalSearch({
  product,
  user,
  domain,
  query,
}: { product: Product; user: User | null; domain: string; query: string }) {
  const [results, setResults] = useState<ExternalItem[] | null>(null);
  const [selected, setSelected] = useState<ExternalItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  if (
    !domain ||
    !features[domain] ||
    !product.features.includes(features[domain]) ||
    query.trim().length < 2
  )
    return null;
  const search = async (nextPage: number) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/api/v1/external/search', {
        params: { domain, q: query.trim(), page: nextPage },
      });
      if (!r.data.configured) {
        setError('Busca adicional indisponível neste momento.');
        setResults([]);
      } else {
        setResults(r.data.results);
        setPage(nextPage);
      }
    } catch (e) {
      setError(message(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const showDetails = async (item: ExternalItem) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get(
        `/api/v1/external/${encodeURIComponent(domain)}/${encodeURIComponent(item.external_id)}`,
      );
      setSelected(r.data);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };
  const add = async (item: ExternalItem) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/api/v1/external/import', {
        domain,
        external_id: item.external_id,
      });
      navigate(`/conteudo/${r.data.id}`);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="external-search" aria-label="Busca adicional">
      <div className="external-search-heading">
        <div>
          <h2>Não encontrou por aqui?</h2>
          <p>
            Amplie a busca para {domains[domain]?.label.toLowerCase() || domain}
            . O catálogo local continua disponível.
          </p>
        </div>
        <button
          type="button"
          className="button-quiet"
          disabled={loading}
          onClick={() => void search(1)}
        >
          {loading ? 'Buscando...' : 'Buscar mais conteúdos'}
        </button>
      </div>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {results && !results.length && !error && (
        <p>Nenhum resultado adicional encontrado.</p>
      )}
      {results && results.length > 0 && (
        <>
          <div className="external-grid">
            {results.map((item) => (
              <article
                key={`${item.provider}-${item.external_id}`}
                className="external-card"
              >
                <Poster item={{ ...item, id: item.external_id }} />
                <div>
                  <span className="section-kicker">
                    {domains[domain]?.singular || domain} ·{' '}
                    {item.provider.toUpperCase()}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.release_date || ''}</p>
                  <button
                    type="button"
                    className="button-quiet"
                    disabled={loading}
                    onClick={() => void showDetails(item)}
                  >
                    Ver detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="pagination">
            <button
              type="button"
              className="button-quiet"
              disabled={loading || page === 1}
              onClick={() => void search(page - 1)}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              type="button"
              className="button-quiet"
              disabled={loading || results.length < 20}
              onClick={() => void search(page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
      {selected && (
        <div className="panel external-detail">
          <h3>{selected.title}</h3>
          <p>{selected.description || 'Descrição não disponível.'}</p>
          {selected.genres && selected.genres.length > 0 && (
            <p>Gêneros: {selected.genres.join(', ')}</p>
          )}
          {selected.release_date && <p>Data: {selected.release_date}</p>}
          <p>Fonte: {selected.provider.toUpperCase()}</p>
          {user ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void add(selected)}
            >
              Adicionar ao catálogo
            </button>
          ) : (
            <p>
              <Link className="text-link" to="/entrar">
                Entre para adicionar e avaliar
              </Link>
            </p>
          )}
          <button
            type="button"
            className="button-quiet"
            onClick={() => setSelected(null)}
          >
            Fechar detalhes
          </button>
        </div>
      )}
    </section>
  );
}
