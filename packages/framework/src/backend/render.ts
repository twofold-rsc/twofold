import { ComponentType, ReactElement, createElement } from "react";

export function componentsToTree<T extends {}>({
  components,
  props,
}: {
  components: ComponentType<T>[];
  props: T;
}): ReactElement {
  if (components.length === 1) {
    return createElement<T>(components[0], props);
  } else {
    return createElement<T>(
      components[0],
      props,
      componentsToTree({
        components: components.slice(1),
        props,
      })
    );
  }
}
