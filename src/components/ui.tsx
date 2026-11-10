import {
  ArrowLeft,
  ArrowRight,
  Disc3,
  Film,
  Gamepad2,
  Music2,
  Star,
  Trophy,
  Tv,
} from 'lucide-react';
import { type ReactNode, forwardRef, useEffect, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import type { Content } from '../api';
import type { ReviewStats } from '../hooks/useReviewStats';

export const domains: Record<
  string,
  { label: string; singular: string; icon: typeof Film }
> = {
  movies: { label: 'Filmes', singular: 'Filme', icon: Film },
  series: { label: 'Séries', singular: 'Série', icon: Tv },
  video_games: { label: 'Jogos', singular: 'Jogo', icon: Gamepad2 },
  football_matches: { label: 'Futebol', singular: 'Partida', icon: Trophy },
  music_albums: { label: 'Música', singular: 'Álbum', icon: Music2 },
};

export function Avatar({
  name,
  size = 'normal',
}: { name: string; size?: 'normal' | 'large' }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {initials}
    </span>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function RatingDisplay({
  rating,
  count,
}: { rating: number | null; count?: number }) {
  return (
    <span className="rating-display" title="Nota da comunidade">
      <Star size={14} fill="currentColor" aria-hidden="true" />
      <strong>{rating === null ? '—' : rating.toFixed(1)}</strong>
      {count !== undefined && (
        <span className="rating-count">
          {count} {count === 1 ? 'avaliação' : 'avaliações'}
        </span>
      )}
    </span>
  );
}
export function RatingInput({
  value,
  onChange,
}: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className="rating-input">
      <span className="rating-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <span className="star-cell" key={star}>
            <Star size={22} />
            {value >= star - 0.5 && (
              <span
                className={value >= star ? 'star-fill' : 'star-fill star-half'}
              >
                <Star size={22} fill="currentColor" />
              </span>
            )}
          </span>
        ))}
      </span>
      <span className="rating-value">
        {Number.isFinite(value) ? value.toFixed(1) : '—'} <span>/ 5</span>
      </span>
      <label className="sr-only" htmlFor="rating-choice">
        Nota (0 a 5)
      </label>
      <Select
        id="rating-choice"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
          <option key={rating} value={rating}>
            {rating.toFixed(1)}
          </option>
        ))}
      </Select>
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Disc3 size={23} />
      </span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <output className="grid" aria-label="Carregando conteúdos">
      {['a', 'b', 'c', 'd', 'e'].slice(0, count).map((id) => (
        <div className="skeleton-card" key={id}>
          <div className="skeleton skeleton-poster" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </output>
  );
}
export function Pagination({
  page,
  next,
  onPage,
}: { page: number; next: boolean; onPage: (value: number) => void }) {
  return (
    <div className="pagination">
      <button
        className="button-quiet"
        type="button"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <ArrowLeft size={15} /> Anterior
      </button>
      <span>Página {page}</span>
      <button
        className="button-quiet"
        type="button"
        disabled={!next}
        onClick={() => onPage(page + 1)}
      >
        Próxima <ArrowRight size={15} />
      </button>
    </div>
  );
}
export function Poster({
  item,
  compact = false,
}: { item: Content; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const domain = domains[item.domain];
  const Icon = domain?.icon || Film;
  return (
    <div
      className={`poster poster--${item.domain} ${compact ? 'poster--compact' : ''}`}
    >
      {item.cover_url && !failed ? (
        <img
          src={item.cover_url}
          alt={`Capa de ${item.title}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback">
          <span className="poster-fallback-top">
            <Icon size={17} />
            <span>
              REVIEW<span>HUB</span>
            </span>
          </span>
          <div className="poster-orbit" />
          <div className="poster-copy">
            <span>{domain?.singular || item.domain}</span>
            <strong>{item.title}</strong>
            <small>
              {String(
                item.metadata.year ||
                  item.metadata.match_date ||
                  'REVIEW · DISCOVER · SHARE',
              )}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
export function ContentCard({
  item,
  stats,
}: { item: Content; stats?: ReviewStats }) {
  const domain = domains[item.domain];
  const year =
    item.metadata.year || item.metadata.match_date || item.release_date;
  return (
    <Link className="content-card" to={`/conteudo/${item.id}`}>
      <Poster item={item} />
      <div className="content-card-info">
        <div className="content-card-meta">
          <span>{domain?.singular || item.domain}</span>
          {year ? (
            <>
              <span>·</span>
              <span>{String(year).slice(0, 4)}</span>
            </>
          ) : null}
        </div>
        <h3>{item.title}</h3>
        <RatingDisplay rating={stats?.average ?? null} count={stats?.count} />
      </div>
    </Link>
  );
}

export function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <dialog
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <span className="section-kicker">CONFIRMAÇÃO</span>
      <h2 id="confirm-title">{title}</h2>
      <p>{description}</p>
      <div className="form-actions">
        <Button className="button-quiet" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={onConfirm}>
          Confirmar exclusão
        </Button>
      </div>
    </dialog>
  );
}

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input ref={ref} {...props} />);
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => <textarea ref={ref} {...props} />);
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>((props, ref) => <select ref={ref} {...props} />);
export function Tooltip({
  text,
  children,
}: { text: string; children: ReactNode }) {
  return (
    <span className="tooltip" title={text}>
      {children}
    </span>
  );
}
export function Toast({ children }: { children: ReactNode }) {
  return <output className="toast">{children}</output>;
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" role="tablist" aria-label="Seções do perfil">
      {options.map((tab, i) => (
        <button
          key={tab.id}
          className="tab"
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const step = e.key === 'ArrowRight' ? 1 : -1;
            const next = options[(i + step + options.length) % options.length];
            onChange(next.id);
            e.currentTarget.parentElement
              ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [(i + step + options.length) % options.length]?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Dropdown({
  label,
  trigger,
  children,
}: { label: string; trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="mobile-account"
      onToggle={(e) => setOpen(e.currentTarget.open)}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest(
            '.account-dropdown a, .account-dropdown button',
          )
        )
          e.currentTarget.open = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.currentTarget.open = false;
          e.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary aria-label={label}>{trigger}</summary>
      {open && <div className="account-dropdown">{children}</div>}
    </details>
  );
}
