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
});
