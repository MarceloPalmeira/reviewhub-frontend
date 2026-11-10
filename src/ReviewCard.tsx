import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReviewSocial } from './Social';
import { type Content, type Product, type Review, type User, api } from './api';
import { Avatar, RatingDisplay, domains } from './components/ui';

export function ReviewCard({
  review,
  user,
  product,
}: { review: Review; user?: User | null; product?: Product }) {
  const [show, setShow] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve(api.get(`/api/v1/users/${review.author_id}`))
      .then((r) => {
        if (active && r?.data?.display_name) setAuthor(r.data);
      })
      .catch(() => {});
    Promise.resolve(api.get(`/api/v1/contents/${review.content_id}`))
      .then((r) => {
        if (active && r?.data?.title) setContent(r.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [review.author_id, review.content_id]);
  const date = review.created_at ? new Date(review.created_at) : null;
  return (
    <article className="review-card panel">
      <div className="review-author">
        <Link
          className="review-author-link"
          to={`/perfil/${review.author_id}`}
          aria-label="Ver autor"
        >
          <Avatar name={author?.display_name || 'Pessoa'} />
          <span>
            <strong>{author?.display_name || 'Pessoa da comunidade'}</strong>
            <small>
              {author?.username ? `@${author.username}` : 'Ver perfil'}
            </small>
          </span>
        </Link>
        <time>
          {date && !Number.isNaN(date.valueOf())
            ? new Intl.DateTimeFormat('pt-BR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(date)
            : ''}
        </time>
      </div>
      {content && (
        <Link
          className="review-content-link"
          to={`/conteudo/${review.content_id}`}
        >
          <span>{domains[content.domain]?.singular || 'Conteúdo'}</span>
          <strong>{content.title}</strong>
          <ArrowUpRight size={15} />
        </Link>
      )}
      <div className="review-heading">
        <strong>{review.title || 'Review'}</strong>
        <RatingDisplay rating={review.rating} />
      </div>
      <p className="review-text">
        {review.spoiler && !show ? 'Esta review contém spoilers.' : review.text}
      </p>
      {review.spoiler && !show && (
        <button
          className="button-quiet spoiler-button"
          type="button"
          onClick={() => setShow(true)}
        >
          Mostrar spoiler
        </button>
      )}
      <div className="review-divider" />
      <div className="review-caption">
        <MessageCircle size={14} /> <span>Compartilhe sua opinião</span>
      </div>
      {product && (
        <ReviewSocial
          reviewId={review.id}
          user={user || null}
          product={product}
        />
      )}
    </article>
  );
}
