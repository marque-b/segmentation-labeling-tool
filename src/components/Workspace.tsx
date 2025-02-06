import { useCOCOStore } from "../store/useCOCOStore";
import DialogInfo from "./DialogInfo";

function NotInitialized() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center">
      <span>
        You have not initialized the Dataset. Click on the button bellow to
        start
      </span>
      <DialogInfo />
    </div>
  );
}

function Workspace() {
  const { info, licenses, images, annotations, categories } = useCOCOStore();

  console.log(info, licenses, images, annotations, categories);
  return (
    <div className="container h-full">
      {!info ? <NotInitialized /> : <div>Fata</div>}
    </div>
  );
}

export default Workspace;
