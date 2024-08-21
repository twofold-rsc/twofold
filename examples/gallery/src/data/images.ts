export let images: Record<string, string[] | undefined> = {
  "new-york-city": [
    "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578297886235-c521966ea880?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1536031696538-924fe11c7037?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604509082195-1d60a05fbe1e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1418075285575-c402f1f7340f?q=80&w=800&auto=format&fit=crop",
  ],
  porsche: [
    "https://images.unsplash.com/photo-1611651186486-415f04eb78e4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617864009083-077a1a297b85?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594279689140-67b7be5ef065?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1699325524552-555bd48866b6?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1683403792818-a48b86226939?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1699325635304-a2f409b06d19?q=80&w=800&auto=format&fit=crop",
  ],
  alps: [
    "https://images.unsplash.com/photo-1521292270410-a8c4d716d518?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518548064064-6dd2b811d6fa?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1527095655060-4026c4af2b25?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517772426385-b95306f095d6?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565475668349-0130bea1059b?q=80&w=800&auto=format&fit=crop",
  ],
};

export function getGallery(name: string) {
  let gallery = images[name];
  return !gallery ? [] : gallery;
}

export function getImageId(src: string) {
  let url = new URL(src);
  return url.pathname.replace(/[^a-z0-9]/gi, "");
}
