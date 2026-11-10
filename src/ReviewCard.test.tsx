// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ReviewCard } from './ReviewCard';

describe('ReviewCard', () => {
  it('oculta spoilers até a pessoa escolher exibi-los', () => {
    render(
      <MemoryRouter>
        <ReviewCard
          review={{
            id: '1',
            author_id: 'a',
            content_id: 'c',
            rating: 4.5,
            title: 'Título',
            text: 'Revelação',
            spoiler: true,
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Revelação')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar spoiler' }));
    expect(screen.getByText('Revelação')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Ver autor' }).getAttribute('href'),
    ).toBe('/perfil/a');
  });
});
