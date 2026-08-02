"use client";

export function Loading() {
  // for testing suspended renders
  //
  // console.log("page fallback rendered");
  //
  // useEffect(() => {
  //   console.log("page fallback committed");
  // }, []);

  return <div className="text-gray-500">Loading...</div>;
}
