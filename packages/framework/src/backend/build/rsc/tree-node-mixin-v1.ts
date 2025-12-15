export type CanGoUnder<Base> = {
  canGoUnder(other: Base): boolean;
};

export type TreeMethods<Base> = {
  readonly parent: Base | null;
  readonly children: readonly Base[];

  detach(): void;
  addChild(node: Base): void;
  setParent(parent: Base | null): void;
};

type TreeState<Node> = {
  parent: Node | null;
  children: Node[];
};

export const TREE: unique symbol = Symbol("tree") as unknown as typeof TREE;

type Self<Base extends object> = Base &
  CanGoUnder<Base> &
  TreeMethods<Base> & { [TREE]?: TreeState<Self<Base>> };

let getState = <Base extends object>(node: Self<Base>) => {
  let existing = node[TREE];
  if (existing) return existing;

  let created: TreeState<Self<Base>> = {
    parent: null,
    children: [],
  };

  node[TREE] = created;
  return created;
};

let removeFromArray = <T>(arr: T[], item: T) => {
  let idx = arr.indexOf(item);
  if (idx === -1) return;
  arr.splice(idx, 1);
};

let isAncestorOf = <Base extends object>(
  maybeAncestor: Self<Base>,
  node: Self<Base>,
) => {
  let cur = getState<Base>(node).parent;
  while (cur) {
    if (cur === maybeAncestor) return true;
    cur = getState<Base>(cur).parent;
  }
  return false;
};

let detachImpl = function <Base extends object>(this: Self<Base>) {
  let s = getState<Base>(this);
  let p = s.parent;
  if (!p) return;

  removeFromArray(getState<Base>(p).children, this);
  s.parent = null;
};

let addChildImpl = function <Base extends object>(
  this: Self<Base>,
  node: Self<Base>,
) {
  if (node === this) throw new Error("Cannot add a node as a child of itself.");
  if (isAncestorOf<Base>(node, this))
    throw new Error("Cannot move a node under its own descendant.");

  // Recursive descent: first child that can accept it
  let target = getState<Base>(this).children.find((child) =>
    node.canGoUnder(child),
  );

  if (target) {
    target.addChild(node);

    // Local rebalance: siblings vs pivot (target)
    let pivot = target;
    let siblings = getState<Base>(this).children.filter((c) => c !== pivot);

    siblings
      .filter((sib) => sib.canGoUnder(pivot))
      .forEach((sib) => pivot.addChild(sib));

    return;
  }

  // Attach here
  node.detach();

  getState<Base>(node).parent = this;
  getState<Base>(this).children.push(node);

  // Local rebalance: siblings vs pivot (inserted node)
  let pivot = node;
  let siblings = getState<Base>(this).children.filter((c) => c !== pivot);

  siblings
    .filter((sib) => sib.canGoUnder(pivot))
    .forEach((sib) => pivot.addChild(sib));
};

let setParentImpl = function <Base extends object>(
  this: Self<Base>,
  parent: Self<Base> | null,
) {
  if (parent === null) {
    this.detach();
    return;
  }
  parent.addChild(this);
};

export let mixTreeInto = <Base extends object>(C: {
  prototype: Base & CanGoUnder<Base>;
}) => {
  type S = Self<Base>;

  Object.defineProperties(C.prototype, {
    parent: {
      get(this: S) {
        return getState<Base>(this).parent;
      },
      enumerable: false,
      configurable: false,
    },
    children: {
      get(this: S) {
        return getState<Base>(this).children;
      },
      enumerable: false,
      configurable: false,
    },
    detach: {
      value: detachImpl<Base>,
      enumerable: false,
      configurable: false,
      writable: false,
    },
    addChild: {
      value: addChildImpl<Base>,
      enumerable: false,
      configurable: false,
      writable: false,
    },
    setParent: {
      value: setParentImpl<Base>,
      enumerable: false,
      configurable: false,
      writable: false,
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Person {
  constructor(public name: string) {}

  canGoUnder(other: Person) {
    return this.name.length < other.name.length;
  }
}

mixTreeInto(Person);

// eslint-disable-next-line
interface Person extends TreeMethods<Person> {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Animal {
  constructor(public name: string) {}

  canGoUnder(other: Person) {
    return this.name.length < other.name.length;
  }

  bark() {
    console.log("bark");
  }
}

mixTreeInto(Animal);

// eslint-disable-next-line
interface Animal extends TreeMethods<Animal> {}

let alice = new Person("alice");
let bob = new Person("bob");
let fido = new Animal("fido");

alice.addChild(bob);
alice.addChild(fido);

alice.children.filter((c) => c instanceof Animal).forEach((c) => c.bark());
