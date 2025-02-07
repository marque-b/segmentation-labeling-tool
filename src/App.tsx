import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Controls from "./components/Controls";
import Workspace from "./components/Workspace";
import AssetPage from "./components/AssetPage";
import EditorPage from "./components/EditorPage";
import RleMonitor from "./components/RleMonitor";

function App() {
  return (
    <Router>
      <main className="min-h-screen">
        <Controls />
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/dataset/:id" element={<AssetPage />} />
          <Route path="/editor/:datasetId/:fileName" element={<EditorPage />} />
          <Route path="/test-rle" element={<RleMonitor />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
