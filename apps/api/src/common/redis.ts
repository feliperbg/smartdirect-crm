export const isRedisEnabled = () =>
  process.env.DISABLE_REDIS !== 'true' &&
  Boolean(
    process.env.REDIS_URL ||
      process.env.REDIS_HOST ||
      process.env.REDIS_PASSWORD,
  );
