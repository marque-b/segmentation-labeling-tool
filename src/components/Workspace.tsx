import { useWorkspaceStore } from "../store/useWorkspaceStore";
import Asset from "./Asset";

const Workspace = () => {
  const { datasets, activeDataset, setActiveDataset, addDataset } =
    useWorkspaceStore();

  return (
    <div className="p-4 bg-gray-800 h-full">
      <h2 className="text-xl font-bold mb-4">Workspace</h2>

      {/* Botão para adicionar um novo dataset */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
        onClick={() => addDataset(`Dataset ${datasets.length + 1}`)}
      >
        + Criar Dataset
      </button>

      {/* Lista de datasets */}
      <div className="mb-4">
        {datasets.map((dataset) => (
          <button
            key={dataset.id}
            className={`mr-2 px-3 py-1 rounded ${
              activeDataset === dataset.id ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveDataset(dataset.id)}
          >
            {dataset.name}
          </button>
        ))}
      </div>

      {/* Renderiza as imagens do dataset ativo */}
      {activeDataset && (
        <div className="grid grid-cols-3 gap-4">
          {datasets
            .find((d) => d.id === activeDataset)
            ?.images.map((image) => (
              <Asset key={image.id} id={image.id} name={image.file_name} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Workspace;
