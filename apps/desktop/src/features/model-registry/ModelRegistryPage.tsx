import { useState } from "react";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";

interface ModelConfig {
  id: string;
  name: string;
  provider: "Cloud" | "API" | "Ollama" | "Hugging Face" | "Local Pack";
  capability: "probe" | "layout" | "ocr_printed" | "ocr_handwriting" | "table_parser" | "field_extractor" | "validator" | "copilot" | "risk_detector";
  status: "installed" | "available" | "installing";
  size?: string;
}

const mockModels: ModelConfig[] = [
  { id: "paddle-ocr-v4", name: "PaddleOCR PP-OCRv4", provider: "Local Pack", capability: "ocr_printed", status: "installed", size: "125 MB" },
  { id: "gpt-4o", name: "GPT-4o (Dossier Cloud)", provider: "Cloud", capability: "field_extractor", status: "installed" },
  { id: "llama-3-8b", name: "Llama 3 8B Instruct", provider: "Ollama", capability: "copilot", status: "available", size: "4.7 GB" },
  { id: "docling-layout", name: "Docling PDF Layout", provider: "Local Pack", capability: "layout", status: "available", size: "300 MB" },
  { id: "azure-document-intelligence", name: "Azure Document Intelligence", provider: "API", capability: "ocr_handwriting", status: "available" }
];

export function ModelRegistryPage() {
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("All");

  const filteredModels = mockModels.filter(model => {
    if (search && !model.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProvider !== "All" && model.provider !== filterProvider) return false;
    return true;
  });

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
            <button className="button button--primary">Add Custom API</button>
          </div>
        </div>
        
        <div className="catalog-header">
          <span>Model Name</span>
          <span>Capability</span>
          <span>Source</span>
          <span>Size</span>
          <span />
        </div>
        
        {filteredModels.length === 0 ? (
          <div className="catalog-empty">
            <p>No models found.</p>
          </div>
        ) : (
          filteredModels.map(model => (
            <div key={model.id} className="catalog-row">
              <span className="catalog-document">
                <span>
                  <strong>{model.name}</strong>
                  <small>{model.id}</small>
                </span>
              </span>
              <span>{model.capability}</span>
              <span>{model.provider}</span>
              <span>{model.size ?? "—"}</span>
              <span style={{ textAlign: "right" }}>
                {model.status === "installed" ? (
                  <button className="button" disabled>Installed</button>
                ) : model.status === "installing" ? (
                  <button className="button" disabled>Installing...</button>
                ) : (
                  <button className="button">Install</button>
                )}
              </span>
            </div>
          ))
        )}
      </section>
    </StandardPageShell>
  );
}
