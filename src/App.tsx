import { Route, Routes } from "react-router-dom";
import CampaignListPage from "./pages/CampaignListPage";
import CampaignPage from "./pages/CampaignPage";
import SessionPage from "./pages/SessionPage";
import EncounterPage from "./pages/EncounterPage";
import FormatsPage from "./pages/FormatsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CampaignListPage />} />
      <Route path="/formats" element={<FormatsPage />} />
      <Route path="/campaigns/:campaignId" element={<CampaignPage />} />
      <Route
        path="/campaigns/:campaignId/sessions/:sessionId"
        element={<SessionPage />}
      />
      <Route
        path="/campaigns/:campaignId/sessions/:sessionId/encounters/:encounterId"
        element={<EncounterPage />}
      />
    </Routes>
  );
}
