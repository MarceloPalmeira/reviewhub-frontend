import { useEffect, useState } from 'react';
import { api } from './api';

export type ImdbRatingData = {
  configured: boolean;
  found: boolean;
  matched_by?: 'imdb_id' | 'title';
  imdb_id?: string;
  rating?: number | null;
  votes?: number | null;
  url?: string;
};

const votesFormat = new Intl.NumberFormat('pt-BR');

export function ImdbRating({ contentId }: { contentId: string }) {
  const [data, setData] = useState<ImdbRatingData | null>(null);
  useEffect(() => {
    let active = true;
    setData(null);
    api
      .get<ImdbRatingData>(`/api/v1/contents/${contentId}/imdb`)
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch(() => {
        if (active) setData(null);
      });
    return () => {
      active = false;
    };
  }, [contentId]);
  if (!data?.found || data.rating == null || !data.url) return null;
  return (
    <a
      className="imdb-rating"
      href={data.url}
      target="_blank"
      rel="noreferrer noopener"
      title={
        data.matched_by === 'title'
          ? 'Associado por título e ano; pode não corresponder exatamente.'
          : 'Nota no IMDb'
      }
    >
      <span className="imdb-logo">IMDb</span>
      <strong>{data.rating.toFixed(1)}</strong>
      <span className="imdb-scale">/10</span>
      {data.votes != null && (
        <span className="rating-count">
          {votesFormat.format(data.votes)} votos
        </span>
      )}
    </a>
  );
}
