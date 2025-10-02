export function partition<T>(arr: T[], condition: (item: T) => boolean) {
  return arr.reduce<[T[], T[]]>(
    (acc, item) => {
      if (condition(item)) {
        acc[0].push(item);
      } else {
        acc[1].push(item);
      }
      return acc;
    },
    [[], []],
  );
}
