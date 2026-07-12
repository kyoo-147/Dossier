import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";
import { ProviderManifest } from "@dossier/contracts/src/provider.js";

const mockProviders: ProviderManifest[] = [
  {
    provider_id: "paddle-ocr-v4",
    provider_name: "PaddleOCR PP-OCRv4",
    provider_type: "ocr_printed",
    version: "1.0",
    capabilities: ["ocr", "vision"],
    input_contract: "dossier.vision.v1",
    output_contract: "dossier.text.v1",
    adapter: { source: "local_pack", requires_api_key: false, size_bytes: 125000000 },
    install_state: "installed",
    checksum: "sha256:local-image-ocr",
    local_path: "runtime/providers/ocr_image",
    license_ref: "Dossier pilot adapter",
    resource_profile: { cpu: 2, memory: "500MB" },
    privacy_profile: { local_only: true },
    health_status: "healthy"
  },
  {
    provider_id: "structured-parser-docling-local",
    provider_name: "Docling-compatible Local Parser",
    provider_type: "structured_parser",
    version: "0.1",
    capabilities: ["structured_parse", "tables", "rag_chunks"],
    input_contract: "dossier.text.v1",
    output_contract: "dossier.document_graph.v1",
    adapter: { source: "local_pack", requires_api_key: false, size_bytes: 64000000 },
    install_state: "installed",
    checksum: "sha256:structured-parser-docling-local",
    local_path: "runtime/providers/structured_parser",
    license_ref: "MIT-compatible adapter boundary",
    resource_profile: { cpu: 2, memory: "1GB" },
    privacy_profile: { local_only: true },
    health_status: "healthy"
  },
  {
    provider_id: "gpt-4o",
    provider_name: "GPT-4o (Dossier Cloud)",
    provider_type: "field_extractor",
    version: "1.0",
    capabilities: ["extraction", "reasoning"],
    input_contract: "dossier.text.v1",
    output_contract: "dossier.json.v1",
    adapter: { source: "cloud", requires_api_key: false },
    install_state: "available",
    license_ref: "Cloud provider terms",
    resource_profile: { network: true },
    privacy_profile: { local_only: false },
    health_status: "healthy"
  },
  {
    provider_id: "llama-3-8b",
    provider_name: "Llama 3 8B Instruct",
    provider_type: "copilot",
    version: "1.0",
    capabilities: ["chat", "reasoning"],
    input_contract: "dossier.chat.v1",
    output_contract: "dossier.chat.v1",
    adapter: { source: "ollama", requires_api_key: false, model_id: "llama3", size_bytes: 4700000000 },
    install_state: "uninstalled",
    checksum: "sha256:llama3-catalog-placeholder",
    license_ref: "Meta Llama license",
    resource_profile: { gpu: "optional", memory: "8GB" },
    privacy_profile: { local_only: true },
    health_status: "uninstalled"
  },
  {
    provider_id: "azure-document-intelligence",
    provider_name: "Azure Document Intelligence",
    provider_type: "ocr_handwriting",
    version: "1.0",
    capabilities: ["ocr", "layout"],
    input_contract: "dossier.vision.v1",
    output_contract: "dossier.layout.v1",
    adapter: { source: "api", requires_api_key: true },
    install_state: "uninstalled",
    license_ref: "Azure service terms",
    resource_profile: { network: true },
    privacy_profile: { local_only: false },
    health_status: "uninstalled"
  }
];

export function ModelRegistryPage() {
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("All");
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; service: string }>({ open: false, service: "" });
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [installingModels, setInstallingModels] = useState<Record<string, boolean>>({});
  const [models, setModels] = useState<ProviderManifest[]>(mockProviders);

  const filteredModels = models.filter(model => {
    if (search && !model.provider_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProvider !== "All" && model.adapter.source !== filterProvider.toLowerCase().replace(" ", "_")) return false;
    return true;
  });

  const handleOpenApiKey = async (service: string) => {
    try {
      const existingKey = await invoke<string | null>("get_api_key", { service });
      setApiKeyValue(existingKey || "");
    } catch (e) {
      console.error(e);
      setApiKeyValue("");
    }
    setApiKeyModal({ open: true, service });
  };

  const handleSaveApiKey = async () => {
    try {
      await invoke("set_api_key", { service: apiKeyModal.service, key: apiKeyValue });
      setApiKeyModal({ open: false, service: "" });
      alert("API Key saved securely.");
    } catch (e) {
      alert("Failed to save API Key");
    }
  };

  const handleInstall = async (provider_id: string) => {
    try {
      setInstallingModels(prev => ({ ...prev, [provider_id]: true }));
      await invoke("install_provider", { providerId: provider_id });
      setModels(prev => prev.map(m => m.provider_id === provider_id ? { ...m, health_status: "healthy", install_state: "installed" } : m));
    } catch (e) {
      alert("Failed to install provider");
    } finally {
      setInstallingModels(prev => ({ ...prev, [provider_id]: false }));
    }
  };

  return (
    <StandardPageShell
      title="Model Registry"
      description="Manage local and cloud providers for extraction, layout, and vision."
      wide={true}
      className="model-registry-page"
    >
      <section className="catalog-panel">
        <div className="catalog-toolbar">
          <div className="toolbar-group">
            <input 
              type="text" 
              className="input" 
              placeholder="Search models..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <select className="input" value={filterProvider} onChange={e => setFilterProvider(e.target.value)}>
              <option value="All">All Sources</option>
              <option value="Local Pack">Local Pack</option>
              <option value="Cloud">Cloud</option>
              <option value="API">API</option>
              <option value="Ollama">Ollama</option>
              <option value="Hugging Face">Hugging Face</option>
            </select>
          </div>
          <div>
            <button className="button button--primary" onClick={() => setApiKeyModal({ open: true, service: "custom_api" })}>Add Custom API</button>
          </div>
        </div>
        
        <div className="catalog-header">
          <span>Model Name</span>
          <span>Capability</span>
          <span>Source</span>
          <span>Status</span>
          <span />
        </div>
        
        {filteredModels.length === 0 ? (
          <div className="catalog-empty">
            <p>No models found.</p>
          </div>
        ) : (
          filteredModels.map(model => (
            <div key={model.provider_id} className="catalog-row">
              <span className="catalog-document">
                <span>
                  <strong>{model.provider_name || model.provider_id}</strong>
                  <small>{model.provider_id}</small>
                </span>
              </span>
              <span>{model.provider_type}</span>
              <span>{model.adapter.source}</span>
              <span>{model.install_state} / {model.health_status}</span>
              <span style={{ textAlign: "right" }}>
                {model.adapter.requires_api_key && (
                  <button className="button" style={{ marginRight: 8 }} onClick={() => handleOpenApiKey(model.provider_id)}>
                    Set API Key
                  </button>
                )}
                {installingModels[model.provider_id] || model.health_status === "installing" ? (
                  <button className="button" disabled>Installing...</button>
                ) : model.health_status === "healthy" ? (
                  <button className="button" disabled>Installed</button>
                ) : (
                  <button className="button" onClick={() => handleInstall(model.provider_id)}>Install</button>
                )}
              </span>
            </div>
          ))
        )}
      </section>

      {apiKeyModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Configure API Key</h3>
            <p style={{ color: '#666', fontSize: 14 }}>Enter the key for {apiKeyModal.service}. It will be stored securely in the system keychain.</p>
            <input 
              type="password" 
              className="input" 
              style={{ width: '100%', marginBottom: 16 }} 
              value={apiKeyValue}
              onChange={e => setApiKeyValue(e.target.value)}
              placeholder="sk-..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="button" onClick={() => setApiKeyModal({ open: false, service: "" })}>Cancel</button>
              <button className="button button--primary" onClick={handleSaveApiKey}>Save</button>
            </div>
          </div>
        </div>
      )}
    </StandardPageShell>
  );
}
