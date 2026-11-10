import { useEffect, useState } from 'react';
import { type Content, api } from '../api';

export type ReviewStats = { count: number; average: number | null };
export function useReviewStats(
  items: Content[] | null,
): Record<string, ReviewStats> {
  const [stats, setStats] = useState<Record<string, ReviewStats>>({});
  useEffect(() => {
    let active = true;
    if (!items?.length) {
      setStats({});
      return;
    }
    const params = new URLSearchParams();
    for (const item of items) params.append('content_id', item.id);
    api
      .get('/api/v1/reviews/stats/batch', { params })
      .then((r) => {
        if (active) setStats(r.data);
      })
      .catch(() => {
        if (active) setStats({});
      });
    return () => {
      active = false;
    };
  }, [items]);
  return stats;
}
