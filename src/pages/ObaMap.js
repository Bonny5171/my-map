import React, { useCallback, useState, useEffect, } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoBox, } from '@react-google-maps/api';
// import { UsePosition } from './position';
import axios from 'axios';




//SETTINGS
const watch = false;

const defaultSettings = {
  enableHighAccuracy: false,
  timeout: Infinity,
  maximumAge: 0,
};
const settings = {
  ...defaultSettings,
};




const ObaMap = () => {
  const [data, setData] = useState([]);
  const [map, setMap] = React.useState(null)
  const [error, setError] = useState(null);
  const [TESTE, setLatlng] = useState({ latitude: -23.5502, longitude: -46.63617, });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBt5L6L3JKtIocOLj_9dkgDmhDJYIAEQ9s"
  });

  const onChange = ({ coords, timestamp }) => {
    console.log(' >>> onChanonChangeonChange', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      heading: coords.heading,
      timestamp,
    });

    setLatlng({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      heading: coords.heading,
      timestamp,
    });
  };

  const onError = (error) => {
    setError(error.message);
  };

  useEffect(() => {
    if (!navigator || !navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    if (watch) {
      const watcher =
        navigator.geolocation.watchPosition(onChange, onError, settings);
      return () => navigator.geolocation.clearWatch(watcher);
    }

    navigator.geolocation.getCurrentPosition(onChange, onError, settings);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(
        `https://obaecommerce.hubin.io/iomanager/api/flows/execute/route/store-finder/stores-list?lat=${TESTE.latitude}&lon=${TESTE.longitude}`,
        {
          headers: {
            'x-wevo-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzZi10b2tlbi0yIiwidGVuYW50Ijoib2JhZWNvbW1lcmNlIiwidHlwZVRva2VuIjoiMiIsImV4cCI6MTY5NzA1MTYwMjM5N30.niQrh7kR8Pd_GavQDZqY4GlKcVlm6d5fxlkdi0p-qMA',
          }
        }
      );

      setData(result.data);
    };

    fetchData();
  }, []);

  const onUnmount = React.useCallback(() => setMap(null), []);

  const onLoad = useCallback(function callback(map) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    const bounds = new window.google.maps.LatLngBounds(TESTE);
    // map.fitBounds(bounds);

    setMap(map)
  }, [])

  console.log(data, TESTE);

  if (data.length > 0) {
    return (
      <div style={{ display: 'flex' }}>
        <code>
          latitude: {TESTE.latitude}<br />
          longitude: {TESTE.longitude}<br />
          timestamp: {TESTE.timestamp}<br />
          accuracy: {TESTE.accuracy && `${TESTE.accuracy} meters`}<br />
          speed: {TESTE.speed}<br />
          heading: {TESTE.heading && `${TESTE.heading} degrees`}<br />
          error: {TESTE.error}
        </code>

        {<ul>{data.map(item => (<li key={item.name}>{item.name}</li>))}</ul>}

        <div>
          { isLoaded
              ? (<GoogleMap
                  mapContainerStyle={{ width: '1000px', height: '600px' }}
                  center={{ lat: TESTE.latitude, lng: TESTE.longitude }}
                  zoom={15}
                  onUnmount={onUnmount}
                >
                </GoogleMap>)
              : <></>}
        </div>
      </div>
    );
  }

  return null;
}
export default ObaMap;