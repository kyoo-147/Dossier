import { describe, expect, it } from "vitest";
import { defineProviderManifest } from "../src/index.js";

describe("provider sdk", () => {
  it("accepts a healthy baseline provider manifest", () => {
    const manifest = defineProviderManifest({
      provider_id: "probe.default",
      provider_type: "probe",
      version: "0.1.0",
      capabilities: ["mode-selection"],
      input_contract: "ProbeRequest",
      output_contract: "ProbeResult",
      adapter: { source: "local_pack", requires_api_key: false },
      resource_profile: { cpu: true, gpu: false },
      privacy_profile: { local_only: true },
      health_status: "healthy"
    });

    expect(manifest.provider_id).toBe("probe.default");
  });

  it("normalizes install state metadata for pilot model registry providers", () => {
    const manifest = defineProviderManifest({
      provider_id: "local-image-ocr",
      provider_name: "Dossier Local Image OCR",
      provider_type: "ocr_printed",
      version: "0.1.0",
      capabilities: ["image_ocr", "scan_ocr"],
      input_contract: "dossier.vision.v1",
      output_contract: "dossier.text.v1",
      adapter: { source: "local_pack", requires_api_key: false },
      install_state: "installed",
      checksum: "sha256:local-image-ocr",
      local_path: "runtime/providers/ocr_image",
      license_ref: "Dossier pilot adapter",
      resource_profile: { cpu: 1, memory: "128MB" },
      privacy_profile: { local_only: true },
      health_status: "healthy"
    });

    expect(manifest.install_state).toBe("installed");
    expect(manifest.local_path).toContain("ocr_image");
  });
});
