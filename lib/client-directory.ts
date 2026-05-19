export type { TenantRuntimeConfig as ClientConfig } from "@/lib/tenant-repository";
export {
  appendTenantContextToUrl as appendClientContextToUrl,
  findTenantById as getClientById,
  findTenantByPhone as getClientByPhone,
  findTenantForPayload as getClientForPayload,
  listTenants as getClientDirectory,
  normalizeTenantPhone as normalizeClientPhone
} from "@/lib/tenant-repository";
