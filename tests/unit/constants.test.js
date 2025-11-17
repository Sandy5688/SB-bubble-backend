const constants = require('../../config/constants');

describe('Constants', () => {
  test('should have USER_ROLES defined', () => {
    expect(constants.USER_ROLES).toBeDefined();
    expect(constants.USER_ROLES.ADMIN).toBe('admin');
    expect(constants.USER_ROLES.USER).toBe('user');
  });

  test('should have WORKFLOW_STATUS defined', () => {
    expect(constants.WORKFLOW_STATUS).toBeDefined();
    expect(constants.WORKFLOW_STATUS.PENDING).toBe('pending');
    expect(constants.WORKFLOW_STATUS.COMPLETED).toBe('completed');
  });

  test('should have PAYMENT_STATUS defined', () => {
    expect(constants.PAYMENT_STATUS).toBeDefined();
    expect(constants.PAYMENT_STATUS.PENDING).toBe('pending');
    expect(constants.PAYMENT_STATUS.COMPLETED).toBe('completed');
  });

  test('should have proper file size limit', () => {
    expect(constants.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  test('should have allowed file types', () => {
    expect(Array.isArray(constants.ALLOWED_FILE_TYPES)).toBe(true);
    expect(constants.ALLOWED_FILE_TYPES.length).toBeGreaterThan(0);
  });
});
