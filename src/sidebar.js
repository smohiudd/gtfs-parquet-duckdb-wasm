import React from 'react';
import './sidebar.css';

export default function Sidebar(props){

  function handleSubmit(e) {
    e.preventDefault();
    console.log(e.target.value);
    props.setTrip(e.target.value);
  }

  function handleRoute(e) {
    e.preventDefault();
    console.log(e.target.value);
    props.setRoute(e.target.value);
  }
 
  return (
    <div className="sidebar-container prose">
      <h1 className='color-red'>GTFS + Parquet + DuckDB WASM</h1>
      <p>This visualization was created using <a target="_blank" href='https://duckdb.org/docs/api/wasm/overview.html' className='link'>DuckDB-Wasm</a> and <a target="_blank" href='https://gtfs.org/' className='link'>GTFS</a> csv files 
        converted to <a target="_blank" href='https://parquet.apache.org/' className='link'>parquet</a> format and served over HTTP. Parquet files are imported in the database by registering urls and SQL queries are completed in the browser.   
        Select a <code className='txt-code'>route</code> and <code className='txt-code'>shape_id</code> below. 
      </p>
      <p>
        Check out the github repo: <a target="_blank" href='https://github.com/smohiudd/gtfs-parquet-duckdb-wasm' className='link'>https://github.com/smohiudd/gtfs-parquet-duckdb-wasm</a>
      </p>
      <div className='select-container py12'>

          <select
              className='select select--stroke color-red'
              value={props.selectedRoute}
              onChange={handleRoute}
          >
              {props.routes.map((item) =>
                <option key={item.route_id} value={item.route_id}>
                  {item.route_short_name} - {item.route_long_name}
                </option>
              )}
          </select>
          <div className='select-arrow'></div>
      
          </div>
          <div className='select-container mb18'>
          <select
              className='select select--stroke color-red'
              value={props.selectedTrip}
              onChange={handleSubmit}
          >
              {props.trips.map((item) =>
                <option key={item.trip_id} value={item.trip_id.toString()}>
                  {item.shape_id.toString()} {item.trip_headsign.toString()}
                </option>
              )}
          </select>
          <div className='select-arrow'></div>
          </div>
          <p>Sample data is for <a target="_blank" href='https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data' className='link'>Translink</a> in Vancouver.
          </p>
      </div>
    
  );
}