import { useCOCOStore } from "../store/useCOCOStore";
import AssetCard from "./AssetCard";
import DialogAddInfo from "./DialogAddInfo";

function NotInitialized() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center">
      <span>
        You have not initialized the Dataset. Click on the button bellow to
        start
      </span>
      <DialogAddInfo />
    </div>
  );
}

function Workspace() {
  const { datasets } = useCOCOStore();

  return (
    <div className="container h-full py-8">
      {datasets.length === 0 ? (
        <NotInitialized />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 place-items-center">
            {datasets.map((dataset) => (
              <AssetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
          <div className="w-full my-8 flex justify-center">
            <DialogAddInfo />
          </div>
        </>
      )}
    </div>
  );
}

export default Workspace;
