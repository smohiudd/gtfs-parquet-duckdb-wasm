import Sidebar from "./sidebar.js";
import "./App.css";
import Map from "./map.js";
import React, { useEffect, useState } from "react";
import { DuckDBClient, makeDB } from "./dbclient.js";

let Db = makeDB();
let db = new DuckDBClient(Db);

let urls = [
  {
    file: "trips.parquet",
    url: "https://gtfs-parquet.s3.us-west-2.amazonaws.com/trips.parquet",
  },
  {
    file: "shapes.parquet",
    url: "https://gtfs-parquet.s3.us-west-2.amazonaws.com/shapes.parquet",
  },
  {
    file: "routes.parquet",
    url: "https://gtfs-parquet.s3.us-west-2.amazonaws.com/routes.parquet",
  },
  {
    file: "stop_times.parquet",
    url: "https://gtfs-parquet.s3.us-west-2.amazonaws.com/stop_times.parquet",
  },
  {
    file: "stops.parquet",
    url: "https://gtfs-parquet.s3.us-west-2.amazonaws.com/stops.parquet",
  },
];

urls.map((file) => {
  db.insertParquet(file);
});

function App() {
  const [tripId, setTripId] = useState(283746);
  const [routeId, setRouteId] = useState("6658");
  const [listRoute, setListRoute] = useState([]);
  const [listTrip, setListTrip] = useState([]);
  const [geom, setGeom] = useState([]);
  const [geomstops, setGeomStops] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState("loading");
  const [loadingShapes, setLoadingShapes] = useState("loading");

  useEffect(() => {
    db.queryStream(
      `SELECT * FROM 'routes.parquet' ORDER BY route_short_name`,
      null,
    ).then((result) => {
      let rows = result.readRows();
      rows.next().then((res) => {
        setListRoute(res.value);
        setLoadingTrips("");
        return rows.next();
      });
    });
  }, []);

  useEffect(() => {
    db.queryStream(
      `
      SELECT DISTINCT ON (shape_id) shape_id, trip_id, trip_headsign 
      FROM 'trips.parquet' WHERE route_id=${routeId}
      `,
      null,
    ).then((result) => {
      let rows = result.readRows();
      rows.next().then((res) => {
        setListTrip(res.value);
        setTripId(res.value[0].trip_id);
        setLoadingShapes("");
        return rows.next();
      });
    });
  }, [routeId]);

  useEffect(() => {
    db.queryStream(
      `
      SELECT shape_pt_sequence, shape_pt_lat, shape_pt_lon FROM
      (SELECT * FROM trips.parquet
      WHERE trip_id=${tripId}) as b
      JOIN shapes.parquet ON b.shape_id=shapes.shape_id
      ORDER BY shape_pt_sequence
      `,
      null,
    ).then((result) => {
      let rows = result.readRows();
      rows.next().then((res) => {
        setGeom(res.value);
        return rows.next();
      });
    });

    db.queryStream(
      `
      SELECT b.stop_id, stop_lat, stop_lon, stop_name FROM
      (SELECT stop_id, stop_sequence FROM stop_times.parquet
      WHERE trip_id=${tripId}
      ORDER BY stop_sequence) as b
      JOIN stops.parquet ON b.stop_id=stops.stop_id
      `,
      null,
    ).then((result) => {
      let rows = result.readRows();
      rows.next().then((res) => {
        setGeomStops(res.value);
        return rows.next();
      });
    });
  }, [tripId]);

  return (
    <div>
      <Map geom={geom} geomstops={geomstops} />

      <Sidebar
        trips={listTrip}
        setTrip={setTripId}
        selectedTrip={tripId}
        routes={listRoute}
        setRoute={setRouteId}
        selectedRoute={routeId}
        loadingTrips={loadingTrips}
        loadingShapes={loadingShapes}
      />
    </div>
  );
}

export default App;
