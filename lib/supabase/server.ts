import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getServerClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function query<T = unknown>(
  table: string,
  options?: {
    select?: string;
    eq?: Record<string, unknown>;
    in?: Record<string, unknown[]>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  },
): Promise<T[] | T | null> {
  const client = getServerClient();
  if (!client) return null;

  let query = client.from(table).select(options?.select || "*");

  if (options?.eq) {
    for (const [key, value] of Object.entries(options.eq)) {
      query = query.eq(key, value);
    }
  }

  if (options?.in) {
    for (const [key, values] of Object.entries(options.in)) {
      query = query.in(key, values);
    }
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? false,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.single) {
    const { data, error } = await query.single();
    if (error) throw error;
    return data as T;
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

export async function insert<T = unknown>(
  table: string,
  values: Record<string, unknown>,
): Promise<T | null> {
  const client = getServerClient();
  if (!client) return null;

  const { data, error } = await client.from(table).insert(values).select().single();
  if (error) throw error;
  return data as T;
}

export async function upsert<T = unknown>(
  table: string,
  values: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[] | null> {
  const client = getServerClient();
  if (!client) return null;

  const { data, error } = await client.from(table).upsert(values as Record<string, unknown>).select();
  if (error) throw error;
  return data as T[];
}

export async function update<T = unknown>(
  table: string,
  values: Record<string, unknown>,
  eq: Record<string, unknown>,
): Promise<T[] | null> {
  const client = getServerClient();
  if (!client) return null;

  let query = client.from(table).update(values);
  for (const [key, value] of Object.entries(eq)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query.select();
  if (error) throw error;
  return data as T[];
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
