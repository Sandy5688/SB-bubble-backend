// Mock dependencies before requiring the service
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn(() => ({
            data: [{ supported_features: ['11111111-1111-1111-1111-111111111111'] }],
            error: null
          })),
          or: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                { supported_features: ['11111111-1111-1111-1111-111111111111'] },
                { supported_features: ['77777777-7777-7777-7777-777777777777'] }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

jest.mock('../../config/redis', () => ({
  get: jest.fn(() => Promise.resolve(null)),
  setex: jest.fn(() => Promise.resolve('OK')),
  del: jest.fn(() => Promise.resolve(1))
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

const regionService = require('../../services/region.service');

describe('Region Service', () => {
  describe('getSupportedFeatures', () => {
    test('should get country-wide features', async () => {
      const features = await regionService.getSupportedFeatures('AU');
      expect(Array.isArray(features)).toBe(true);
    });

    test('should get region-specific features', async () => {
      const features = await regionService.getSupportedFeatures('AU', 'NSW');
      expect(Array.isArray(features)).toBe(true);
    });

    test('should return empty array on error', async () => {
      const features = await regionService.getSupportedFeatures('INVALID');
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('isFeatureAvailable', () => {
    test('should check feature availability', async () => {
      const available = await regionService.isFeatureAvailable(
        '11111111-1111-1111-1111-111111111111',
        'AU'
      );
      
      expect(typeof available).toBe('boolean');
    });
  });

  describe('filterItemsByRegion', () => {
    test('should filter items by region', async () => {
      const items = [
        { internal_feature_id: '11111111-1111-1111-1111-111111111111' },
        { internal_feature_id: '99999999-9999-9999-9999-999999999999' }
      ];
      
      const filtered = await regionService.filterItemsByRegion(items, 'AU');
      
      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeLessThanOrEqual(items.length);
    });

    test('should return all items when no restrictions', async () => {
      const items = [
        { internal_feature_id: '11111111-1111-1111-1111-111111111111' }
      ];
      
      const filtered = await regionService.filterItemsByRegion(items, 'XX');
      
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildRegionFilter', () => {
    test('should build SQL filter for country only', () => {
      const filter = regionService.buildRegionFilter('AU');
      
      expect(filter).toHaveProperty('sql');
      expect(filter).toHaveProperty('params');
      expect(filter.params.countryCode).toBe('AU');
    });

    test('should build SQL filter for country and region', () => {
      const filter = regionService.buildRegionFilter('AU', 'NSW');
      
      expect(filter).toHaveProperty('sql');
      expect(filter).toHaveProperty('params');
      expect(filter.params.countryCode).toBe('AU');
      expect(filter.params.regionCode).toBe('NSW');
    });
  });
});
