import * as duckdb from "@duckdb/duckdb-wasm";
import getType from "./types.js";

async function makeDB() {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    }),
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  console.log("DB initialized");

  const conn = await db.connect();
  await conn.query(`
      INSTALL parquet; LOAD parquet;
    `);
  await conn.close();
  console.log("Extension initialized");

  return db;
}

// DuckDB Client from CMU https://observablehq.com/@cmudig/duckdb
class DuckDBClient {
  constructor(_db) {
    this._db = _db;
    this._counter = 0;
  }

  async queryStream(query, params) {
    const conn = await this.connection();
    let result;

    if (params) {
      const stmt = await conn.prepare(query);
      result = await stmt.query(...params);
    } else {
      result = await conn.query(query);
    }

    // Populate the schema of the results
    const schema = result.schema.fields.map(({ name, type }) => ({
      name,
      type: getType(String(type)),
      databaseType: String(type),
    }));
    return {
      schema,
      async *readRows() {
        let rows = result.toArray().map((r) => Object.fromEntries(r));
        yield rows;
      },
    };
  }

  // This function gets called to prepare the `query` parameter of the `queryStream` method
  queryTag(strings, ...params) {
    return [strings.join("?"), params];
  }

  escape(name) {
    return `"${name}"`;
  }

  async describeTables() {
    const conn = await this.connection();
    const tables = (await conn.query(`SHOW TABLES`)).toArray();
    return tables.map(({ name }) => ({ name }));
  }

  async describeColumns({ table } = {}) {
    const conn = await this.connection();
    const columns = (await conn.query(`DESCRIBE ${table}`)).toArray();
    return columns.map(({ column_name, column_type }) => {
      return {
        name: column_name,
        type: getType(column_type),
        databaseType: column_type,
      };
    });
  }

  async db() {
    if (!this._db) {
      this._db = await makeDB();
      await this._db.open({
        query: {
          castTimestampToDate: true,
        },
      });
    }
    return this._db;
  }

  async connection() {
    if (!this._conn) {
      const db = await this.db();
      this._conn = await db.connect();
    }
    return this._conn;
  }

  async reconnect() {
    if (this._conn) {
      this._conn.close();
    }
    delete this._conn;
  }

  // The `.queryStream` function will supercede this for SQL and Table cells
  // Keeping this for backwards compatibility
  async query(query, params) {
    const key = `Query ${this._counter++}: ${query}`;
    console.time(key);
    const conn = await this.connection();
    let result;

    if (params) {
      const stmt = await conn.prepare(query);
      result = stmt.query(...params);
    } else {
      result = await conn.query(query);
    }

    console.timeEnd(key);
    return result;
  }

  // The `.queryStream` function will supercede this for SQL and Table cells
  // Keeping this for backwards compatibility
  async sql(strings, ...args) {
    // expected to be used like db.sql`select * from table where foo = ${param}`

    // let queryWithParams = strings.join("?");
    // if (typeof args !== 'undefined'){
    //   for (const param of args) {
    //     queryWithParams = queryWithParams.replace('?', param);
    //   }
    // }
    // const results = await this.query(queryWithParams);

    const results = await this.query(strings.join("?"), args);

    // return rows as a JavaScript array of objects for now
    let rows = results.toArray().map(Object.fromEntries);
    rows.columns = results.schema.fields.map((d) => d.name);
    return rows;
  }

  async table(query, params, opts) {
    const result = await this.query(query, params);
    return result;
  }

  // get the client after the query ran
  async client(query, params) {
    await this.query(query, params);
    return this;
  }

  // query a single row
  async queryRow(query, params) {
    const key = `Query ${this._counter++}: ${query}`;

    console.time(key);
    const conn = await this.connection();
    // use send as we can stop iterating after we get the first batch
    const result = await conn.send(query, params);
    const batch = (await result.next()).value;
    console.timeEnd(key);

    return batch?.get(0);
  }

  // Describe the database (no arg) or a table
  async describe(object) {
    const result = await (object === undefined
      ? this.query(`SHOW TABLES`)
      : this.query(`DESCRIBE ${object}`));
    return result;
  }

  // Summarize a query result
  async summarize(query) {
    const result = await this.query(`SUMMARIZE ${query}`);
    return result;
  }

  async insertParquet(name) {
    // const res = await fetch(`./${name}`);
    // const buffer = await res.arrayBuffer();

    const db = await this.db();

    // await db.registerFileBuffer(name, new Uint8Array(buffer));
    await db.registerFileURL(
      name.file,
      name.url,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    const conn = await db.connect();
    await conn.query(
      `CREATE VIEW IF NOT EXISTS '${name.file}' AS SELECT * FROM parquet_scan('${name.file}')`,
    );
    await conn.close();

    return this;
  }
}

export { makeDB, DuckDBClient };
