import mountainImage from "./mountain.jpg";

export default function AssetsPage() {
  return (
    <div>
      <div>test: {mountainImage}</div>
      <img src={mountainImage} alt="Mountain" />
    </div>
  );
}
