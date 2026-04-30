declare module "virtual:twofold/server-application-router" {
  const default_: import("./router.tsx").ApplicationRuntime;
  export default default_;
}
declare module "virtual:twofold/server-global-middleware" {
  const default_: ((req: Request) => Promise<Response | undefined>) | undefined;
  export default default_;
}
