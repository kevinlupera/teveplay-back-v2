export type Bindings = {
  DB: D1Database;
  API_KEY: string;
  SECRET_KEY: string;
  SECRET_IV: string;
};

declare global {
  function getMiniflareBindings(): Bindings;
}
