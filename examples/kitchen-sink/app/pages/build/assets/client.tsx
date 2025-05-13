"use client";

import grassImage from "./grass.jpg";

export function ClientComponentImage() {
  return (
    <div>
      <div className="font-medium">Client import</div>
      <div className="mt-1 text-sm text-gray-500">Image: {grassImage}</div>
      <img src={grassImage} alt="Grass" className="mt-2 block w-32" />
    </div>
  );
}
