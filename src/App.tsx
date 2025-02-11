import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Controls from "./components/Controls";
import Workspace from "./components/Workspace";
import AssetPage from "./components/AssetPage";
import EditorPage from "./components/EditorPage";
import { Toaster } from "@/components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Controls />
        <Workspace />
      </>
    ),
  },
  {
    path: "/dataset/:id",
    element: (
      <>
        <Controls />
        <AssetPage />
      </>
    ),
  },
  {
    path: "/editor/:datasetId/:fileName",
    element: (
      <>
        <Controls />
        <EditorPage />
      </>
    ),
  },
]);

function App() {
  return (
    <main className="min-h-screen">
      <RouterProvider router={router} />
      <Toaster />
    </main>
  );
}

export default App;
