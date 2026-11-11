import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { type Content, type Product, type User, api } from './api';
import { ContentCard, LoadingSkeleton } from './components/ui';
import { useReviewStats } from './hooks/useReviewStats';

export type Recommendation = {
  score: number;
  reason: string;
  content: Content;
};
type Response = { based_on: number; items: Recommendation[] };

/** Seção da Home alimentada pelo Recommendation Service. */
export function Recommendations({
  product,
  user,
}: {
  product: Product;
  user: User | null;
}) {
  const active = product.features.includes('recommendations') && !!user;
  const [data, setData] = useState<Response | null>(null);
  const [failed, setFailed] = useState(false);
  const items = data?.items.slice(0, 5).map((r) => r.content) ?? null;
  const stats = useReviewStats(items);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    api
      .get<Response>('/api/v1/recommendations', { params: { limit: 5 } })
      .then((r) => {
        if (alive) setData(r.data);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [active]);
  if (!active || failed) return null;
  return (
    <section className="content-section recommendations">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            <Sparkles size={13} /> RECOMMENDATION SERVICE
          </span>
          <h2>Recomendado para você</h2>
          <p>
            {data && data.based_on > 0
              ? `Com base nas suas ${data.based_on} avaliações.`
              : 'Avalie conteúdos para receber sugestões personalizadas. Por enquanto, o que está em alta.'}
          </p>
        </div>
        <Link className="section-link" to="/catalogo">
          Ver catálogo <ArrowRight size={15} />
        </Link>
      </div>
      {data === null ? (
        <LoadingSkeleton count={5} />
      ) : (
        <div className="grid">
          {data.items.slice(0, 5).map((r) => (
            <div className="recommendation" key={r.content.id}>
              <ContentCard item={r.content} stats={stats[r.content.id]} />
              <span className="recommendation-reason">{r.reason}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
