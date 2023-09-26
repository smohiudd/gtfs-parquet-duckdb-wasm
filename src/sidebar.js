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
      <p>This visualization was created using <a href='#Links' className='link'>DuckDb WASM</a> and GTFS csv files converted to <a href='#Links' className='link'>parquet</a> format. 
        Select a <code className='txt-code'>route</code> and <code className='txt-code'>shape_id</code> below.
        Parquet files are registered and SQL queries are completed in the browser by joining tables.  
      </p>
      <div className='select-container py12'>

          <select
              className='select select--stroke color-red'
              value={props.selectedRoute}
              onChange={handleRoute}
          >
              {props.routes.map((item) =>
                <option key={item.route_id} value={item.route_id}>
                  {item.route_long_name}
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
          <p>The sample data is for <a href='#Links' className='link'>Translink</a> in Vancouver.
          </p>
      </div>
    
  );
}