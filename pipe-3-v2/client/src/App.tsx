import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import HomePage from "./pages/HomePage";
import RunPage from "./pages/RunPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/run/:runId" element={<RunPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
