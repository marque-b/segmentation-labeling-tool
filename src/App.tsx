import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Controls from "./components/Controls";
import Workspace from "./components/Workspace";
import AssetPage from "./components/AssetPage";
import EditorPage from "./components/EditorPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <main className="min-h-screen">
        <Controls />
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/dataset/:id" element={<AssetPage />} />
          <Route path="/editor/:datasetId/:fileName" element={<EditorPage />} />
        </Routes>
      </main>
      <Toaster />
    </Router>
  );
}

export default App;
