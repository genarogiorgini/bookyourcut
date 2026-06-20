export interface AppConfig {
  port: number;
  corsOrigins: string[];
  pendingHoldMinutes: number;
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  pendingHoldMinutes: parseInt(process.env.PENDING_HOLD_MINUTES ?? '30', 10),
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
  },
});
