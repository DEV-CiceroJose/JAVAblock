export function loadEnv(source = process.env) {
  return {
    adminToken: source.ADMIN_TOKEN || '',
    port: Number(source.PORT) || 4000,
    corsOrigins: (source.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  };
}
