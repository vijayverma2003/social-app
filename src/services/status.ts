const STATUS_CODES = {
  SUCCESS: 200 as const,
  CREATED: 201 as const,
  BAD_REQUEST: 400 as const,
  UNAUTHORIZED: 401 as const,
  FORBIDDEN: 403 as const,
  NOT_FOUND: 404 as const,
  CONFLICT: 409 as const,
  INTERNAL_SERVER_ERROR: 500 as const,
};

export default STATUS_CODES;
