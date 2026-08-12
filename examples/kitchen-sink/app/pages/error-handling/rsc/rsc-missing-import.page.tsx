// build-error-on
// import { doesntExist } from "doesnt-exist";

export default function Page() {
  // build-error-on
  // console.log({ doesntExist });
  return (
    <div>
      <div>You shouldn't see this</div>
    </div>
  );
}
