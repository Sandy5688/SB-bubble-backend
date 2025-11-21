// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.INTERNAL_API_KEY = 'test-internal-api-key';
process.env.INTERNAL_HMAC_SECRET = 'test-hmac-secret-for-testing-at-least-32-chars-long';

// Mock Supabase for tests
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          is: jest.fn(() => Promise.resolve({ 
            data: [{ supported_features: ['11111111-1111-1111-1111-111111111111'] }], 
            error: null 
          })),
          or: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [
                { supported_features: ['11111111-1111-1111-1111-111111111111'] },
                { supported_features: ['77777777-7777-7777-7777-777777777777'] }
              ],
              error: null
            }))
          }))
        })),
        in: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    auth: {
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: { id: '123' } }, 
        error: null 
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: { id: '123' }, session: { access_token: 'token' } }, 
        error: null 
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null }))
    }
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
