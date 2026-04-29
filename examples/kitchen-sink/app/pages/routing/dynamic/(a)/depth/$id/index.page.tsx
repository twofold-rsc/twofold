import { PageProps } from "@redpointgames/framework/types";

export default function Page(props: PageProps<"id">) {
  return (
    <div>
      This is the dynamic route with route parameter 'id' equal to '
      {props.params.id}'.
    </div>
  );
}
