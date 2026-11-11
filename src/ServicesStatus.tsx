import { useEffect, useState } from 'react';
import { type Product, api } from './api';

type Service = { id: string; label: string; role: string; feature?: string };

/** Microsserviços da arquitetura, exibidos com o estado de /health. */
export const SERVICES: Service[] = [
  { id: 'identity', label: 'Identity', role: 'contas, login e seguidores' },
  {
    id: 'catalog',
    label: 'Catalog',
    role: 'conteúdos, listas e APIs externas',
  },
  { id: 'reviews', label: 'Reviews', role: 'avaliações, comentários e feed' },
  {
    id: 'recommendations',
    label: 'Recommendations',
    role: 'sugestões pelo histórico',
    feature: 'recommendations',
  },
];

type State = 'checking' | 'up' | 'down';

export function ServicesStatus({ product }: { product: Product }) {
  const visible = SERVICES.filter(
    (s) => !s.feature || product.features.includes(s.feature),
  );
  const [states, setStates] = useState<Record<string, State>>({});
  useEffect(() => {
    let alive = true;
    for (const service of visible) {
      api
        .get(`/health/${service.id}`)
        .then(() => alive && setStates((s) => ({ ...s, [service.id]: 'up' })))
        .catch(
          () => alive && setStates((s) => ({ ...s, [service.id]: 'down' })),
        );
    }
    return () => {
      alive = false;
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: lista derivada do produto
  }, [product]);
  return (
    <section className="services-status" aria-label="Microsserviços">
      <span className="section-kicker">MICROSSERVIÇOS DESTE PRODUTO</span>
      <ul>
        {visible.map((service) => {
          const state = states[service.id] || 'checking';
          return (
            <li key={service.id} data-state={state}>
              <span className="service-dot" aria-hidden="true" />
              <strong>{service.label}</strong>
              <span>{service.role}</span>
              <span className="sr-only">
                {state === 'up'
                  ? 'em execução'
                  : state === 'down'
                    ? 'indisponível'
                    : 'verificando'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
