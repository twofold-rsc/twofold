declare module "virtual:twofold/server-application-router" {
  const default_: import("./router.tsx").ApplicationRuntime;
  export default default_;
}
declare module "virtual:twofold/server-global-middleware" {
  function default_(req: Request): Promise<Response | undefined>;
  export default default_;
}
declare module "virtual:twofold/server-references-meta-map" {
  const default_: Record<
    string,
    {
      loadModule: () => Promise<ModuleSurface>;
      appPath: string;
    }
  >;
  export default default_;
}
declare module "virtual:twofold/server-global-auth" {
  const default_:
    | ((props: AuthPolicyProps) => Promise<AuthPolicyResult>)
    | undefined;
  export default default_;
}
