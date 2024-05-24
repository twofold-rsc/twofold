export function expandFrom<T>(array: T[], from: number) {
  return array.reduce(
    (result, item, index) => {
      let pos =
        index === from
          ? array.length - 1
          : index > from
            ? array.length - 1 - index
            : array.length - 1 - from + index;

      result[pos] = item;
      return result;
    },
    [...array],
  );
}

export function collapseTo<T>(array: T[], to: number) {
  return array.reduce(
    (result, item, index) => {
      let pos = index === to ? 0 : index < to ? to - index : index;

      result[pos] = item;
      return result;
    },
    [...array],
  );
}
