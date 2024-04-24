const db = [
  {
    id: "mint-chocolate-chip",
    name: "Mint chocolate chip",
    votes: 4,
  },
  {
    id: "peanut-butter-oreo",
    name: "Peanut butter oreo",
    votes: 1,
  },
  {
    id: "cookie-dough",
    name: "Cookie dough",
    votes: 3,
  },
  {
    id: "moose-tracks",
    name: "Moose tracks",
    votes: 2,
  },
];

export async function sql(query: TemplateStringsArray, options?: any) {
  if (query[0].includes("update")) {
    let id = options;
    let record = db.find((flavor) => flavor.id === id);
    if (record) {
      record.votes += 1;
    }
  }
  return db;
}
