import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface AssetProps {
  id: number;
  name: string;
}

const Asset = ({ id, name }: AssetProps) => {
  const { setActiveImage } = useWorkspaceStore();

  return (
    <div
      className="bg-gray-700 p-2 rounded-lg shadow-md cursor-pointer hover:bg-gray-600"
      onClick={() => setActiveImage(id)}
    >
      <p className="text-center mt-2">{name}</p>
    </div>
  );
};

export default Asset;
