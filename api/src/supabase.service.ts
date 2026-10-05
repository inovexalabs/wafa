import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient | null;

  constructor() {
    this.adminClient = this.createServiceRoleClient();
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.',
      );
    }

    return this.adminClient;
  }

  /**
   * A throwaway client for calls that establish a user session
   * (signInWithPassword, refreshSession). supabase-js keeps that session in
   * memory and sends the user's JWT on every later request, so running them
   * on the shared admin client would downgrade it from service role to that
   * user and storage RLS would start rejecting uploads.
   */
  createSessionClient(): SupabaseClient {
    const client = this.createServiceRoleClient();
    if (!client) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.',
      );
    }

    return client;
  }

  private createServiceRoleClient(): SupabaseClient | null {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        })
      : null;
  }
}
