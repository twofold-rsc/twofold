const db = [
  { id: 1, count: 10 },
  { id: 2, count: 225 },
  { id: 3, count: 14 },
];

export function sql(template: TemplateStringsArray) {
  if (template[0].includes("update")) {
    db[1].count += 1;
  }
  return db;
}
