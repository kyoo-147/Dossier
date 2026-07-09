import { ProviderManifestSchema, type ProviderManifest } from "@dossier/contracts";

export function defineProviderManifest(manifest: ProviderManifest): ProviderManifest {
  return ProviderManifestSchema.parse(manifest);
}
