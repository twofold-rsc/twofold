import { ClientComponentImage } from "./client";
import mountainImage from "./mountain.jpg";
import drawingImage from "./drawing.png";
import colorSvg from "./color.svg";

export default function AssetsPage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Image imports
      </h1>

      <div className="mt-8">
        <div className="font-medium">RSC import</div>
        <div className="mt-1 text-sm text-gray-500">Image: {mountainImage}</div>
        <img src={mountainImage} alt="Mountain" className="mt-2 block w-32" />
      </div>

      <div className="mt-8">
        <ClientComponentImage />
      </div>

      <div className="mt-8">
        <div className="font-medium">PNG import</div>
        <div className="mt-1 text-sm text-gray-500">Image: {drawingImage}</div>
        <img src={drawingImage} alt="Mountain" className="mt-2 block w-32" />
      </div>

      <div className="mt-8">
        <div className="font-medium">SVG import</div>
        <div className="mt-1 text-sm text-gray-500">Image: {colorSvg}</div>
        <img src={colorSvg} alt="Color" className="mt-2 block w-32" />
      </div>
    </div>
  );
}
