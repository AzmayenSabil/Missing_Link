import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:runId" element={<ChatPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
