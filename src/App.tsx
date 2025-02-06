import Controls from "./components/Controls";
import Workspace from "./components/Workspace";

function App() {
  return (
    <main className="flex flex-col justify-center items-center h-screen">
      <Controls />
      <div className="flex-1 overflow-hidden min-w-full">
        <Workspace />
      </div>
    </main>
  );
}

export default App;
