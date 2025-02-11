import { useEffect, useState } from "react";
import { useCOCOStore } from "../store/useCOCOStore";
import AssetCard from "./AssetCard";
import DialogAddInfo from "./DialogAddInfo";

function Workspace() {
  const { datasets } = useCOCOStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(datasets.length > 0);
  }, [datasets]);

  function NotInitialized() {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 text-center">
        <span className=" text-gray-400">
          You have not initialized the Dataset.
          <br />
          Click on the button bellow to start
        </span>
        <DialogAddInfo initialized={initialized} />
      </div>
    );
  }

  return (
    <div className="container h-full py-8">
      {!initialized ? (
        <NotInitialized />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 place-items-center">
            {datasets.map((dataset) => (
              <AssetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
          <div className="w-full my-8 flex justify-center">
            <DialogAddInfo initialized={initialized} />
          </div>
        </>
      )}
    </div>
  );
}

export default Workspace;
