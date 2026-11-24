/**
 * Centralised environment configuration.
 * Every module reads settings from here, never from process.env directly.
 */
function toInt(value: string | undefined, fallback: number): number {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const config = {
  port: toInt(process.env.PORT, 5001),
  dbPath: process.env.DB_PATH,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  seedCount: toInt(process.env.SEED_COUNT, 3000),
} as const;

export default config;
