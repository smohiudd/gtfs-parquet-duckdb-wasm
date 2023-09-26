import React from 'react';
import './App.css';
import * as duckdb from '@duckdb/duckdb-wasm';
import {DuckDBClient, makeDB} from './dbclient.js'
import maplibregl from 'maplibre-gl';

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state={
      db:null,
      conn:null
    }
  }

  componentDidMount() {
    
    let db = makeDB()
    this.db = new DuckDBClient(db);

    this.insertParquet("trips.parquet").then(() => {
      this.db.queryStream(`SELECT * FROM 'trips.parquet' WHERE trip_id=13527203 LIMIT 100`,null).then((result) => {
        let rows = result.readRows()
        console.log(result.schema)
        rows.next()
        .then((res) => {
          console.log(res); // { value: 0, done: false }
          return rows.next();
        })
        
      })
    })

  }

  async insertParquet(name) {
    const res = await fetch(`./${name}`);
    const buffer = await res.arrayBuffer();

    this.db.insertParquet(name, buffer)

    return this;
  }

  render() {
      return (

        <div>
          <h1>hi</h1>
        </div>
    
        );
  }

}
