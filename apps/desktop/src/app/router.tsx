import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell.js";
import { DocumentsPage } from "../features/documents/DocumentsPage.js";
import { InboxPage } from "../features/inbox/InboxPage.js";
import { QuickOcrPage } from "../features/quick-ocr/QuickOcrPage.js";
import { ReviewPage } from "../features/review/ReviewPage.js";
import { SettingsPage } from "../features/settings/SettingsPage.js";
import { WorkspacePage } from "../features/workspace/WorkspacePage.js";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/quick-ocr" element={<QuickOcrPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
