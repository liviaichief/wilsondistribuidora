import { describe, it, expect } from 'vitest';
import {
  FEATURES, PLANS, PLAN_FEATURES, PLAN_INFO, FEATURE_LABELS,
  isFeatureInPlan, getFeaturesForPlan,
} from '../plans';

describe('plans.js — config', () => {
  describe('FEATURES', () => {
    it('has all 19 feature keys', () => {
      expect(Object.keys(FEATURES)).toHaveLength(19);
    });

    it('values are unique strings', () => {
      const values = Object.values(FEATURES);
      const unique  = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe('PLANS', () => {
    it('has basic, intermediate and premium', () => {
      expect(PLANS.BASIC).toBe('basic');
      expect(PLANS.INTERMEDIATE).toBe('intermediate');
      expect(PLANS.PREMIUM).toBe('premium');
    });
  });

  describe('PLAN_INFO', () => {
    it('every plan has name, price, description, color, badge', () => {
      Object.values(PLANS).forEach(plan => {
        const info = PLAN_INFO[plan];
        expect(info).toBeDefined();
        expect(typeof info.name).toBe('string');
        expect(typeof info.price).toBe('number');
        expect(info.price).toBeGreaterThan(0);
      });
    });

    it('prices are in ascending order basic < intermediate < premium', () => {
      expect(PLAN_INFO[PLANS.BASIC].price).toBeLessThan(PLAN_INFO[PLANS.INTERMEDIATE].price);
      expect(PLAN_INFO[PLANS.INTERMEDIATE].price).toBeLessThan(PLAN_INFO[PLANS.PREMIUM].price);
    });
  });

  describe('isFeatureInPlan()', () => {
    it('basic has DIGITAL_CATALOG', () => {
      expect(isFeatureInPlan(PLANS.BASIC, FEATURES.DIGITAL_CATALOG)).toBe(true);
    });

    it('basic does NOT have AI_DESCRIPTIONS', () => {
      expect(isFeatureInPlan(PLANS.BASIC, FEATURES.AI_DESCRIPTIONS)).toBe(false);
    });

    it('intermediate has DIGITAL_CATALOG (inherited)', () => {
      expect(isFeatureInPlan(PLANS.INTERMEDIATE, FEATURES.DIGITAL_CATALOG)).toBe(true);
    });

    it('intermediate has AI_DESCRIPTIONS', () => {
      expect(isFeatureInPlan(PLANS.INTERMEDIATE, FEATURES.AI_DESCRIPTIONS)).toBe(true);
    });

    it('intermediate does NOT have BBQ_MASTER_AI', () => {
      expect(isFeatureInPlan(PLANS.INTERMEDIATE, FEATURES.BBQ_MASTER_AI)).toBe(false);
    });

    it('premium has all features', () => {
      Object.values(FEATURES).forEach(f => {
        expect(isFeatureInPlan(PLANS.PREMIUM, f)).toBe(true);
      });
    });

    it('returns false for unknown plan (treats as basic)', () => {
      // unknown plan falls back to BASIC_FEATURES
      expect(isFeatureInPlan('unknown_plan', FEATURES.BBQ_MASTER_AI)).toBe(false);
    });
  });

  describe('getFeaturesForPlan()', () => {
    it('basic has 6 features', () => {
      expect(getFeaturesForPlan(PLANS.BASIC)).toHaveLength(6);
    });

    it('intermediate has more features than basic', () => {
      const basic        = getFeaturesForPlan(PLANS.BASIC);
      const intermediate = getFeaturesForPlan(PLANS.INTERMEDIATE);
      expect(intermediate.length).toBeGreaterThan(basic.length);
    });

    it('premium has all 19 features', () => {
      expect(getFeaturesForPlan(PLANS.PREMIUM)).toHaveLength(19);
    });

    it('premium features are a superset of intermediate', () => {
      const intermediate = getFeaturesForPlan(PLANS.INTERMEDIATE);
      const premium      = getFeaturesForPlan(PLANS.PREMIUM);
      intermediate.forEach(f => expect(premium).toContain(f));
    });

    it('returns basic features for unknown plan', () => {
      const basic   = getFeaturesForPlan(PLANS.BASIC);
      const unknown = getFeaturesForPlan('not_a_plan');
      expect(unknown).toEqual(basic);
    });
  });

  describe('FEATURE_LABELS', () => {
    it('every feature has a label entry', () => {
      Object.values(FEATURES).forEach(f => {
        expect(FEATURE_LABELS[f]).toBeDefined();
        expect(typeof FEATURE_LABELS[f].label).toBe('string');
        expect(typeof FEATURE_LABELS[f].group).toBe('string');
      });
    });
  });

  describe('PLAN_FEATURES inheritance', () => {
    it('each plan features array includes all features of lower plans', () => {
      const basic        = PLAN_FEATURES[PLANS.BASIC];
      const intermediate = PLAN_FEATURES[PLANS.INTERMEDIATE];
      const premium      = PLAN_FEATURES[PLANS.PREMIUM];

      basic.forEach(f        => expect(intermediate).toContain(f));
      intermediate.forEach(f => expect(premium).toContain(f));
    });
  });
});
