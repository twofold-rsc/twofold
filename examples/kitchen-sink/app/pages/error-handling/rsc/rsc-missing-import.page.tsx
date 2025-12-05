// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { doesntExist } from "doesnt-exist";
// import MissingImage from "@/images/missing.png";

export default function Page() {
  // ERROR:
  // console.log({ doesntExist });
  return (
    <div>
      <div>You shouldn't see this</div>
      {/* <img src={MissingImage} /> */}
    </div>
  );
}
