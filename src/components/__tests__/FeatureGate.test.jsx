import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGate } from '../common/FeatureGate';
import { FEATURES } from '../../config/plans';

// Mock usePlan to control hasFeature and loading
vi.mock('../../hooks/usePlan', () => ({
  usePlan: vi.fn(),
}));

import { usePlan } from '../../hooks/usePlan';

const setup = ({ hasFeature = () => false, loading = false } = {}) => {
  usePlan.mockReturnValue({ hasFeature, loading });
};

describe('FeatureGate', () => {
  it('renders children when hasFeature returns true', () => {
    setup({ hasFeature: () => true });
    render(
      <FeatureGate feature={FEATURES.DIGITAL_CATALOG}>
        <span>Protected Content</span>
      </FeatureGate>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders null (nothing) when feature is not available and no fallback', () => {
    setup({ hasFeature: () => false });
    const { container } = render(
      <FeatureGate feature={FEATURES.BBQ_MASTER_AI}>
        <span>Premium Feature</span>
      </FeatureGate>
    );
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders fallback when feature is not available', () => {
    setup({ hasFeature: () => false });
    render(
      <FeatureGate feature={FEATURES.BBQ_MASTER_AI} fallback={<span>Upgrade Required</span>}>
        <span>Premium Feature</span>
      </FeatureGate>
    );
    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
  });

  it('renders upgrade card when showUpgradeCard=true and feature unavailable', () => {
    setup({ hasFeature: () => false });
    render(
      <FeatureGate feature={FEATURES.BBQ_MASTER_AI} showUpgradeCard>
        <span>Premium Feature</span>
      </FeatureGate>
    );
    // Upgrade card contains "Fazer Upgrade"
    expect(screen.getByText('Fazer Upgrade')).toBeInTheDocument();
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
  });

  it('renders null while loading (prevents flash of content)', () => {
    setup({ hasFeature: () => true, loading: true });
    const { container } = render(
      <FeatureGate feature={FEATURES.DIGITAL_CATALOG}>
        <span>Content</span>
      </FeatureGate>
    );
    expect(container.firstChild).toBeNull();
  });

  it('passes feature name to upgrade card', () => {
    setup({ hasFeature: () => false });
    render(
      <FeatureGate feature={FEATURES.BBQ_MASTER_AI} showUpgradeCard>
        <div />
      </FeatureGate>
    );
    // Feature label from FEATURE_LABELS should appear
    expect(screen.getByText(/Mestre do Churrasco/i)).toBeInTheDocument();
  });
});
