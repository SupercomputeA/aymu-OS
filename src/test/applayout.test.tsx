import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoDesk } from '@/components/apps/DemoDesk';
import { AppLayout } from '@/components/apps/AppLayout';
import { Newspaper } from 'lucide-react';

describe('AppLayout hero', () => {
  it('renders the hero (icon + code + title → thesis), not a bare pane', () => {
    render(
      <DemoDesk
        spec={{
          code: 'NEWS DESK',
          title: 'News desk',
          thesis: 'the broadsheet: publishing desk.',
          icon: Newspaper,
          items: [{ name: 'Social Media' }, { name: 'Blog' }],
        }}
      />,
    );

    expect(screen.getByText('NEWS DESK')).toBeInTheDocument();
    expect(screen.getByText('News desk')).toBeInTheDocument();
    expect(screen.getByText(/the broadsheet/)).toBeInTheDocument();
    expect(screen.getByText('Social Media')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
  });

  it('renders an explicit not-wired state on demo desks', () => {
    render(
      <DemoDesk
        spec={{
          code: 'NEWS DESK',
          title: 'News desk',
          thesis: 'the broadsheet: publishing desk.',
          icon: Newspaper,
          items: [{ name: 'Social Media' }],
        }}
      />,
    );
    expect(screen.getAllByText(/Not wired — demo surface/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/not wired/i).length).toBeGreaterThanOrEqual(1);
  });

  it('AppLayout itself renders title + thesis', () => {
    render(
      <AppLayout code="TEST" title="Test App" thesis="a test thesis.">
        <div>content</div>
      </AppLayout>,
    );
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('a test thesis.')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
