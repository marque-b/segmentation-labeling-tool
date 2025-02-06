import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Controls from "./components/Controls";
import Workspace from "./components/Workspace";
import AssetPage from "./components/AssetPage";

function App() {
  return (
    <Router>
      <main className="min-h-screen">
        <Controls />
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/dataset/:id" element={<AssetPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
