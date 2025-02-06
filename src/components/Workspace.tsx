import { useCOCOStore } from "../store/useCOCOStore";

function Workspace() {
  const { info, licenses, images, annotations, categories } = useCOCOStore();

  console.log(info, licenses, images, annotations, categories);
  return <div>Workspace</div>;
}

export default Workspace;
