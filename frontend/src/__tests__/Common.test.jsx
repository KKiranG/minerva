import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';

import { ExpandableCard } from '../components/Common';

describe('ExpandableCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with minimal props and hides children by default', () => {
    render(<ExpandableCard title="Test Title">Test Children</ExpandableCard>);
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.queryByText('Test Children')).toBeNull();
    expect(screen.getByRole('button', { name: /Expand/i })).toBeTruthy();
  });

  it('renders all optional props when provided', () => {
    render(
      <ExpandableCard
        title="Test Title"
        subtitle="Test Subtitle"
        meta={[<span key="1">Meta 1</span>, <span key="2">Meta 2</span>]}
        badge="Test Badge"
        preview="Test Preview"
      >
        Test Children
      </ExpandableCard>
    );

    expect(screen.getByText('Test Subtitle')).toBeTruthy();
    expect(screen.getByText('Meta 1')).toBeTruthy();
    expect(screen.getByText('Meta 2')).toBeTruthy();
    expect(screen.getByText('Test Badge')).toBeTruthy();
    expect(screen.getByText('Test Preview')).toBeTruthy();
  });

  it('opens and closes when clicking the Expand/Collapse button', () => {
    render(<ExpandableCard title="Test Title">Test Children</ExpandableCard>);

    // Initially closed
    expect(screen.queryByText('Test Children')).toBeNull();

    // Click Expand
    const button = screen.getByRole('button', { name: /Expand/i });
    fireEvent.click(button);

    // Now open
    expect(screen.getByText('Test Children')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Collapse/i })).toBeTruthy();

    // Click Collapse
    fireEvent.click(screen.getByRole('button', { name: /Collapse/i }));

    // Closed again
    expect(screen.queryByText('Test Children')).toBeNull();
    expect(screen.getByRole('button', { name: /Expand/i })).toBeTruthy();
  });

  it('starts open if defaultOpen is true', () => {
    render(
      <ExpandableCard title="Test Title" defaultOpen={true}>
        Test Children
      </ExpandableCard>
    );

    expect(screen.getByText('Test Children')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Collapse/i })).toBeTruthy();
  });

  it('correctly handles empty meta array', () => {
    render(
      <ExpandableCard title="Test Title" meta={[]}>
        Test Children
      </ExpandableCard>
    );

    expect(screen.getByText('Test Title')).toBeTruthy();
  });
});
