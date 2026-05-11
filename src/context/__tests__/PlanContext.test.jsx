import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PlanProvider, usePlanContext } from '../PlanContext';
import { FEATURES, PLANS } from '../../config/plans';

// settingsService is already mocked via setup.js (Appwrite mock)
// but we need to control getSettings return value per test
vi.mock('../../services/settingsService', () => ({
  getSettings: vi.fn(),
}));

vi.mock('../../config/clientConfig', () => ({
  DEFAULT_CLIENT_CONFIG: {
    store_name:    'Test Store',
    color_primary: '#800020',
    color_accent:  '#D4AF37',
    active_plan:   'basic',
  },
  mergeClientConfig: (cfg) => ({ ...cfg }),
  applyClientTheme:  vi.fn(),
}));

import { getSettings } from '../../services/settingsService';

function TestConsumer() {
  const { currentPlan, hasFeature, planInfo, loading } = usePlanContext();
  if (loading) return <div>loading...</div>;
  return (
    <div>
      <span data-testid="plan">{currentPlan}</span>
      <span data-testid="has-ai">{hasFeature(FEATURES.AI_DESCRIPTIONS) ? 'yes' : 'no'}</span>
      <span data-testid="has-bbq">{hasFeature(FEATURES.BBQ_MASTER_AI) ? 'yes' : 'no'}</span>
      <span data-testid="plan-name">{planInfo?.name}</span>
    </div>
  );
}

describe('PlanContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to basic plan when settings has no active_plan', async () => {
    getSettings.mockResolvedValueOnce({});
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('plan').textContent).toBe('basic');
  });

  it('loads intermediate plan from settings', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'intermediate' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('plan').textContent).toBe('intermediate');
  });

  it('loads premium plan from settings', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'premium' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('plan').textContent).toBe('premium');
  });

  it('falls back to basic for invalid plan value', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'enterprise' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('plan').textContent).toBe('basic');
  });

  it('hasFeature returns false for AI_DESCRIPTIONS on basic plan', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'basic' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('has-ai').textContent).toBe('no');
  });

  it('hasFeature returns true for AI_DESCRIPTIONS on intermediate plan', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'intermediate' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('has-ai').textContent).toBe('yes');
  });

  it('hasFeature returns true for BBQ_MASTER_AI only on premium', async () => {
    getSettings.mockResolvedValueOnce({ active_plan: 'premium' });
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('has-bbq').textContent).toBe('yes');
  });

  it('handles settings load failure gracefully (stays on basic)', async () => {
    getSettings.mockRejectedValueOnce(new Error('Network error'));
    render(<PlanProvider><TestConsumer /></PlanProvider>);
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    expect(screen.getByTestId('plan').textContent).toBe('basic');
  });

  it('throws if usePlanContext is used outside PlanProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    consoleError.mockRestore();
  });
});
