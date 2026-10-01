import { z } from 'zod';

/**
 * Provider accounts (a.k.a. organizations / connections) — one cloud identity
 * the platform syncs with. For Azure an account is one Entra tenant plus its
 * service principal.
 *
 * Accounts come from two sources:
 *  - `env`   — the `AZURE_ORGS` / single-SP environment variables. Read-only in
 *              the UI: the file that defines them is the source of truth.
 *  - `store` — entered in the Providers page, kept in the local encrypted
 *              credential store. Editable.
 *
 * The client secret is write-only over the wire: it is never returned by the
 * API, only `secretSet` reports whether one is held.
 */

export const PROVIDER_ACCOUNT_SOURCES = ['env', 'store'] as const;
export type ProviderAccountSource = (typeof PROVIDER_ACCOUNT_SOURCES)[number];

export interface ProviderAccountDto {
  id: string;
  providerKey: string;
  name: string;
  tenantId: string;
  clientId: string;
  /** True when a client secret is held for this account. The value never leaves the server. */
  secretSet: boolean;
  enabled: boolean;
  source: ProviderAccountSource;
  /** False for env-sourced accounts, which are edited in `.env` and not here. */
  editable: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Where the platform is currently getting its credentials, for the UI banner. */
export interface ProviderAccountsStatusDto {
  providerKey: string;
  /** Accounts from the encrypted store. */
  storeCount: number;
  /** Accounts from environment variables. */
  envCount: number;
  /** Host mode: no accounts at all — the API reuses the ambient `az login`. */
  hostMode: boolean;
  /** True when the store's encryption key comes from config rather than a local key file. */
  externalKey: boolean;
}

// Azure tenant/client ids are GUIDs; keep the check loose enough for other
// providers but tight enough to catch a pasted display name.
const guid = z.string().regex(/^[0-9a-fA-F-]{36}$/, 'must be a GUID');

export const createProviderAccountSchema = z.object({
  name: z.string().min(1).max(120),
  tenantId: guid,
  clientId: guid,
  clientSecret: z.string().min(1).max(2048),
  enabled: z.boolean().default(true),
});
export type CreateProviderAccountRequest = z.infer<typeof createProviderAccountSchema>;

/** Every field optional — omitting `clientSecret` keeps the stored one. */
export const updateProviderAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  tenantId: guid.optional(),
  clientId: guid.optional(),
  clientSecret: z.string().min(1).max(2048).optional(),
  enabled: z.boolean().optional(),
});
export type UpdateProviderAccountRequest = z.infer<typeof updateProviderAccountSchema>;
