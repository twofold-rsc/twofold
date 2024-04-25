import cookies from "@twofold/framework/cookies";

const defaultDb = [
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

function serialize(db: any) {
  cookies.set("flavors-database", JSON.stringify(db), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });
}

function load(): typeof defaultDb {
  let cookie = cookies.get("flavors-database");

  if (cookie) {
    try {
      return JSON.parse(cookie);
    } catch (e) {
      return defaultDb;
    }
  }

  return defaultDb;
}

export async function sql(query: TemplateStringsArray, options?: any) {
  let db = load();
  if (query[0].includes("update") && options) {
    let id = options;
    let newDb = db.map((flavor) => {
      return {
        ...flavor,
        votes: flavor.id === id ? flavor.votes + 1 : flavor.votes,
      };
    });
    serialize(newDb);
  } else if (query[0].includes("update") && !options) {
    let newDb = db.map((flavor) => {
      return {
        ...flavor,
        votes: 0,
      };
    });
    serialize(newDb);
  }
  return db;
}
