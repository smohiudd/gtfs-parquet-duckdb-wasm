import React from 'react';
import './App.css';
import * as duckdb from '@duckdb/duckdb-wasm';
import {DuckDBClient, makeDB} from './dbclient.js'

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state={
      db:null,
      conn:null
    }
  }

  componentDidMount() {
    this.initializeExtension() 
    this.insertParquet("trips.parquet").then(() => {
      this.queryDB().then((result) => {
        console.log(result)
      })
    })

  }

  async db_connect() {
    if (!this.db) {
      console.log("making db")
      this.db = await this.makeDB();
      await this.db.open({
        query: {
          castTimestampToDate: true
        }
      });
    }
    return this.db;
  }

  async connection() {
    if (!this.conn) {
      const db = await this.db_connect();
      this.conn = await db.connect();
    }
    return this.conn;
  }

  async describeTables() {
    const conn = await this.connection();
    const tables = (await conn.query(`SHOW TABLES`)).toArray();
    return tables.map(({ name }) => ({ name }));
  }

  async initializeExtension(){
    const db = await this.db_connect();
    const conn = await db.connect();
    await conn.query(`
      INSTALL parquet; LOAD parquet;
    `)
    await conn.close();
    console.log("Extension initialized")
    return this;
  }

  async makeDB(){
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
    )

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    console.log("DB initialized")
    return db;
  }

  async insertParquet(name) {
    const res = await fetch(`./${name}`);
    const db = await this.db_connect();

    await db.registerFileBuffer(name, new Uint8Array(await res.arrayBuffer()));
    const conn = await db.connect();
    await conn.query(
      `CREATE VIEW IF NOT EXISTS '${name}' AS SELECT * FROM parquet_scan('${name}')`
    );
    await conn.close();
    console.log(`Inserted parquet file ${name}`)

    return this;
  }

  async queryDB(){

    const db = await this.db_connect();
    const conn = await db.connect();
    const arrowResult = await conn.query(
      `SELECT * FROM 'trips.parquet' LIMIT 10`
    );
    console.log(arrowResult)
    const results = arrowResult.toArray().map((row) => row.toJSON());
    console.log(results)
    await conn.close();

  }
  render() {
      return (
      <div className="App">
        <p>This is a test</p>
        
      </div>
    );
  }

}
