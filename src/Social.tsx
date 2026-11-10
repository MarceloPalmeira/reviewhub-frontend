import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReviewCard } from './ReviewCard';
import { type Product, type Review, type User, api, message } from './api';
import { EmptyState, Pagination } from './components/ui';

type Comment = { id: string; author_id: string; text: string };
export function ReviewSocial({
  reviewId,
  user,
  product,
}: { reviewId: string; user: User | null; product: Product }) {
  const commentsEnabled = product.features.includes('comments');
  const likesEnabled = product.features.includes('review_likes');
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<{ count: number; liked: boolean } | null>(
    null,
  );
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      if (commentsEnabled)
        setComments(
          (await api.get(`/api/v1/reviews/${reviewId}/comments`)).data,
        );
      if (likesEnabled && user)
        setLikes((await api.get(`/api/v1/reviews/${reviewId}/likes`)).data);
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }, [reviewId, commentsEnabled, likesEnabled, user]);
  useEffect(() => {
    void load();
  }, [load]);
  if (!commentsEnabled && !likesEnabled) return null;
  return (
    <section aria-label="Interações da review">
      {error && <p role="alert">{error}</p>}
      {likesEnabled && user && likes && (
        <button
          type="button"
          onClick={async () => {
            try {
              if (likes.liked)
                await api.delete(`/api/v1/reviews/${reviewId}/likes`);
              else await api.post(`/api/v1/reviews/${reviewId}/likes`);
              await load();
            } catch (e) {
              setError(message(e));
            }
          }}
        >
          {likes.liked ? 'Descurtir' : 'Curtir'} ({likes.count})
        </button>
      )}
      {commentsEnabled && (
        <div>
          <h4>Comentários</h4>
          {comments.length ? (
            comments.map((c) => (
              <p key={c.id}>
                <Link to={`/perfil/${c.author_id}`}>Autor</Link>: {c.text}
              </p>
            ))
          ) : (
            <p>Nenhum comentário.</p>
          )}
          {user ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                try {
                  await api.post(`/api/v1/reviews/${reviewId}/comments`, {
                    text,
                  });
                  setText('');
                  await load();
                } catch (err) {
                  setError(message(err));
                }
              }}
            >
              <label>
                Comentário{' '}
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <button type="submit">Comentar</button>
            </form>
          ) : (
            <p>Entre para comentar.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function ProfileSocial({
  profileId,
  user,
}: { profileId: string; user: User | null }) {
  const [counts, setCounts] = useState<{
    followers: number;
    following: number;
  } | null>(null);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setCounts((await api.get(`/api/v1/users/${profileId}/social`)).data);
      if (user) {
        const r = await api.get(`/api/v1/users/${user.id}/following`);
        setFollowing(r.data.includes(profileId));
      }
    } catch (e) {
      setError(message(e));
    }
  }, [profileId, user]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {counts && (
        <p>
          {counts.followers} seguidores · {counts.following} seguindo
        </p>
      )}
      {user && user.id !== profileId && (
        <button
          type="button"
          onClick={async () => {
            try {
              if (following)
                await api.delete(`/api/v1/users/${profileId}/follow`);
              else await api.post(`/api/v1/users/${profileId}/follow`);
              await load();
            } catch (e) {
              setError(message(e));
            }
          }}
        >
          {following ? 'Deixar de seguir' : 'Seguir'}
        </button>
      )}
    </div>
  );
}

export function Feed({ user, product }: { user: User; product: Product }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/api/v1/feed', { params: { page } })
      .then((r) => setReviews(r.data))
      .catch((e) => setError(message(e)));
  }, [page]);
  return (
    <>
      <div className="page-intro compact">
        <span className="section-kicker">SUA COMUNIDADE</span>
        <h1>Histórias compartilhadas.</h1>
        <p>Veja o que as pessoas que você acompanha estão descobrindo.</p>
      </div>
      <h1 className="sr-only">Feed</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : reviews === null ? (
        <p>Carregando feed...</p>
      ) : reviews.length ? (
        reviews.map((r) => (
          <ReviewCard key={r.id} review={r} user={user} product={product} />
        ))
      ) : (
        <EmptyState title="Seu feed ainda está vazio">
          Siga pessoas da comunidade para ver as próximas reviews aqui.
        </EmptyState>
      )}
      {reviews && reviews.length > 0 && (
        <Pagination page={page} next={reviews.length >= 20} onPage={setPage} />
      )}
    </>
  );
}
