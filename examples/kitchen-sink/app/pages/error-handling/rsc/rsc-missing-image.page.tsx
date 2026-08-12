// build-error-on
// import MissingImage from "@/images/missing.png";

export default function Page() {
  return (
    <div>
      <div>You shouldn't see this missing image</div>
      {/* build-error-on */}
      {/* <img src={MissingImage} /> */}
    </div>
  );
}
