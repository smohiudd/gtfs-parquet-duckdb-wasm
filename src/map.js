import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import {lineString, bbox, point,featureCollection} from '@turf/turf'

export default function Map(props) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-123.05489829032321);
  const [lat] = useState(49.246881151735);
  const [zoom] = useState(10);

  useEffect(() => {

    if (map.current) return; // stops map from intializing more than once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [lng, lat],
      zoom: zoom
    });
    
    map.current.on('load', function () {
      map.current.addSource('route', {
        'type': 'geojson',
        'data': null
      });
      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': 'black',
          'line-width': 3
        }
      });
      map.current.addSource('stops', {
        'type': 'geojson',
        'data': null
      });
      map.current.addLayer({
        'id': 'stops',
        'type': 'symbol',
        'source': 'stops',
        'layout': {
          'text-field': ['get', 'stop_name'],
          'text-font': [
              'Open Sans Semibold',
              'Arial Unicode MS Bold'
          ],
          'text-size': 12,
          'text-offset': [5, -3],
          'text-anchor': 'top'
          },
        "paint": {
            "text-color": "#fc2c03",
            "text-halo-color": "#fff",
            "text-halo-width": 2
        },
        })
      map.current.addLayer({
        'id': 'stop-circle',
        'type': 'circle',
        'source': 'stops',
        'paint': {
          'circle-radius': 6,
          'circle-color': '#fc2c03'
        }
      });
    });    
  }, [lng, lat, zoom]);

  useEffect(() => {
    if(!props.geom || props.geom.length==0) return;
    let coords = props.geom.map((item) => [item.shape_pt_lon,item.shape_pt_lat])
    let line = lineString(coords);
    map.current.getSource('route').setData(line)
    let box = bbox(line);
    map.current.fitBounds(box, { padding: 30 });
  },[props.geom])

  useEffect(() => {
    if(!props.geomstops || props.geomstops.length==0) return;
    let points = props.geomstops.map((item) => point([item.stop_lon,item.stop_lat], {stop_name: item.stop_name}))
    let collection = featureCollection(points);
    map.current.getSource('stops').setData(collection)
  },[props.geomstops])

  return (
    <div >
      <div ref={mapContainer} className="map"/>
    </div>
  );
}