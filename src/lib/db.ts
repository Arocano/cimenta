import { AsyncLocalStorage } from "async_hooks";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { TABLE_NAMES, type Database, type TableName } from "./types";

const currentTx = new AsyncLocalStorage<Tx>();

export type Filters = Record<string, string | number | boolean | null>;
export type Row = Record<string, unknown> & { id: string };
type Writable = Record<string, unknown> & { id?: string };

export type ProjectGraph = { project: Row; rows: Partial<Record<TableName, Row[]>> };

export type Tx = {
  list(table: TableName, filters?: Filters): Promise<Row[]>;
  insert(table: TableName, row: Writable): Promise<Row>;
  update(table: TableName, id: string, patch: Record<string, unknown>): Promise<Row>;
  remove(table: TableName, id: string): Promise<void>;
  projectGraph(projectId: string, orgId: string, tables: TableName[]): Promise<ProjectGraph | null>;
};

const filePath = path.join(process.cwd(), ".data", "cimenta.json");
let chain: Promise<unknown> = Promise.resolve();

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function emptyDatabase(): Database {
  const db = {} as Database;
  for (const name of TABLE_NAMES) db[name] = [] as never;
  return db;
}

function matches(row: Row, filters: Filters = {}) {
  return Object.entries(filters).every(([key, value]) => row[key] === value);
}

async function fileTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    let db = emptyDatabase();
    try {
      const parsed = JSON.parse(await readFile(filePath, "utf8")) as Database;
      db = { ...emptyDatabase(), ...parsed };
      for (const name of TABLE_NAMES) db[name] ??= [] as never;
    } catch {
      db = emptyDatabase();
    }
    const tx: Tx = {
      async list(table, filters) {
        return (db[table] as unknown as Row[]).filter((row) => matches(row, filters));
      },
      async insert(table, row) {
        const next = { ...row, id: row.id ?? crypto.randomUUID() } as Row;
        (db[table] as unknown as Row[]).push(next);
        return next;
      },
      async update(table, id, patch) {
        const rows = db[table] as unknown as Row[];
        const current = rows.find((row) => row.id === id);
        if (!current) throw new Error("Registro no encontrado.");
        Object.assign(current, patch);
        return current;
      },
      async remove(table, id) {
        const rows = db[table] as unknown as Row[];
        const index = rows.findIndex((row) => row.id === id);
        if (index >= 0) rows.splice(index, 1);
      },
      async projectGraph(projectId, orgId, tables) {
        const project = (db.projects as unknown as Row[]).find((row) => row.id === projectId && row.org_id === orgId);
        if (!project) return null;
        const rows: ProjectGraph["rows"] = {};
        for (const table of tables) {
          rows[table] = (db[table] as unknown as Row[]).filter((row) => row.project_id === projectId);
        }
        return { project, rows };
      },
    };
    const result = await fn(tx);
    await writeFile(filePath, JSON.stringify(db));
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Query = {
  select: (columns: string) => Query;
  insert: (row: unknown) => Query;
  update: (patch: unknown) => Query;
  delete: () => Query;
  eq: (column: string, value: string | number | boolean | null) => Query;
  is: (column: string, value: null) => Query;
  single: () => Promise<{ data: Row | null; error: { message: string } | null }>;
  then: PromiseLike<{ data: Row[] | null; error: { message: string } | null }>["then"];
};

function optionalUuid(key: string) {
  return key !== "id" && key.endsWith("_id");
}

function toPostgres(row: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    if (optionalUuid(key) && value === "") {
      next[key] = null;
      continue;
    }
    next[key] = value;
  }
  return next;
}

function fromPostgres(row: Row): Row {
  const next = { ...row };
  for (const [key, value] of Object.entries(next)) {
    if (value === null && optionalUuid(key)) next[key] = "";
  }
  return next;
}

export async function transaction<T>(fn: (tx: Tx) => Promise<T>, client?: { from: (table: string) => Query }): Promise<T> {
  const active = currentTx.getStore();
  if (active) return fn(active);
  if (!supabaseConfigured()) return fileTransaction((tx) => currentTx.run(tx, () => fn(tx)));
  const supabase = (client ?? (await (await import("./supabase/server")).createClient())) as unknown as { from: (table: string) => Query };
  const tx = supabaseTx(supabase);
  return currentTx.run(tx, () => fn(tx));
}

function supabaseTx(supabase: { from: (table: string) => Query }): Tx {
  const tx: Tx = {
    async list(table, filters = {}) {
      let query = supabase.from(table).select("*");
      for (const [key, value] of Object.entries(filters)) {
        query = value === null || (value === "" && optionalUuid(key)) ? query.is(key, null) : query.eq(key, value);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => fromPostgres(row));
    },
    async insert(table, row) {
      const id = typeof row.id === "string" && row.id.trim() ? row.id : crypto.randomUUID();
      const next = toPostgres({ ...row, id });
      // La lectura de projects no alcanza a ver la fila en el mismo insert y Postgres lo informa como fallo de RLS.
      const { error } = await supabase.from(table).insert(next);
      if (error) throw new Error(error.message);
      return fromPostgres(next as Row);
    },
    async update(table, id, patch) {
      const { data, error } = await supabase.from(table).update(toPostgres(patch)).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No se pudo actualizar el registro.");
      return fromPostgres(data);
    },
    async remove(table, id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    async projectGraph(projectId, orgId, tables) {
      const select = ["*", ...tables.map((table) => `${table}(*)`)].join(",");
      try {
        const query = supabase.from("projects").select(select).eq("id", projectId).eq("org_id", orgId);
        const { data, error } = await (query as unknown as { maybeSingle(): Promise<{ data: Row | null; error: { message: string } | null }> }).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        const rows: ProjectGraph["rows"] = {};
        for (const table of tables) {
          const nested = data[table];
          rows[table] = Array.isArray(nested) ? nested.map((row) => fromPostgres(row as Row)) : [];
          delete data[table];
        }
        return { project: fromPostgres(data), rows };
      } catch {
        const project = (await tx.list("projects", { id: projectId, org_id: orgId }))[0];
        if (!project) return null;
        const listed = await Promise.all(tables.map(async (table) => [table, await tx.list(table, { project_id: projectId })] as const));
        return { project, rows: Object.fromEntries(listed) };
      }
    },
  };
  return tx;
}
