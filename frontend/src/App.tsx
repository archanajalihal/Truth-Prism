import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";
import DashboardPage from "./pages/DashboardPage";

export interface AnalysisResult {
  // Core fields (V2)
  score: number;
  status: "Likely False" | "Uncertain" | "Likely True";
  explanation: string;
  claim?: string;
  inputType?: string;
  sources?: { title: string; source: string; url: string }[];
  // Legacy fields (V1 compat)
  risk?: "High" | "Medium" | "Low";
  flags?: string[];
  datasetMatches?: string[];
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
