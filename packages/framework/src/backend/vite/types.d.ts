declare module "virtual:twofold/server-application-router" {
  const default_: import("./router.tsx").ApplicationRuntime;
  export default default_;
}
declare module "virtual:twofold/server-global-middleware" {
  function default_(req: Request): Promise<Response | undefined>;
  export default default_;
}
