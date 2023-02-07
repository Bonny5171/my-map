import React, { useState, useEffect, } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, } from '@react-google-maps/api';
import axios from 'axios';
import ajax from '../assets/ajax-loader.gif';
import marker_orange from '../assets/orange@2x.png';
import marker_pink from '../assets/pink@2x.png';



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
  const [map, setMap] = React.useState(null)
  const [error, setError] = useState(null);
  const [coord, setLatlng] = useState({ latitude: -23.5502, longitude: -46.63617, });  // Praça da SÉ
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [centerPosition, setCenterPosition] = useState({ lat: -23.5502, lng: -46.63617 });

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

    setCenterPosition({ lat: coords.latitude, lng: coords.longitude })
  };

  const onError = (error) => {
    setError(error.message);
  };

  // Pega localização
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

  // Pega os markers
  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(
        `https://obaecommerce.hubin.io/iomanager/api/flows/execute/route/store-finder/stores-list?lat=${coord.latitude}&lon=${coord.longitude}`,
        {
          headers: {
            'x-wevo-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzZi10b2tlbi0yIiwidGVuYW50Ijoib2JhZWNvbW1lcmNlIiwidHlwZVRva2VuIjoiMiIsImV4cCI6MTY5NzA1MTYwMjM5N30.niQrh7kR8Pd_GavQDZqY4GlKcVlm6d5fxlkdi0p-qMA',
          }
        }
      );
      const dataFormated = result.data.map(element => {
        const nameSlited = element.name.split('-')[1];
        return {
          nameFormated: nameSlited,
          ...element,
        }
      })
      setMarkers(dataFormated);
    };

    fetchData();
  }, []);

  const onUnmount = React.useCallback(() => setMap(null), []);

  console.log(markers, coord);

  return (
    <div style={{ display: 'flex' }}>
      {/* <code>
        latitude: {coord.latitude}<br />
        longitude: {coord.longitude}<br />
        timestamp: {coord.timestamp}<br />
        accuracy: {coord.accuracy && `${coord.accuracy} meters`}<br />
        speed: {coord.speed}<br />
        heading: {coord.heading && `${coord.heading} degrees`}<br />
        error: {coord.error}
      </code> */}

      {<ul>{markers.map((item, index) => (<li
        key={item.nameFormated}
        onClick={() => {
          map.panTo({ lat: item.lat, lng: item.lon });
          setActiveMarker(index);
        }}
      >
        <p>{item.nameFormated}</p>
        <p>{item.address.fullAddress}</p>
        <p>{item.address.city}/{item.address.state}</p>
        {item.phoneNumber ? (<p>Telefone: {item.phoneNumber}</p>) : null}
        {item.whatsapp ? (<p>WhatsApp: {item.whatsapp}</p>) : null}
      </li>))}</ul>}

      <div>
        { isLoaded
            ? (<GoogleMap
                onLoad={map => setMap(map)}
                mapContainerStyle={{ width: '1000px', height: '600px' }}
                center={centerPosition}
                zoom={14}
                onUnmount={onUnmount}
                options={{
                  // zoomControl: false,
                  // fullscreenControl: false,
                  controlSize: 25,
                  mapTypeControl: false,
                  streetViewControl: false,
                  gestureHandling: "greedy",
                }}
              >
                <Marker
                  // key={'current_location'}
                  key={Math.random().toString(36).slice(2, 7)}
                  position={{ lat: coord.latitude, lng: coord.longitude }}
                  onClick={() => setActiveMarker(null)}
                  icon={{ url: marker_pink, scaledSize: new window.google.maps.Size(25, 38) }}
                />
                {markers.map((
                    {
                      lat,
                      lon,
                      name,
                      nameFormated,
                      storeNumber,
                      phoneNumber,
                      whatsapp,
                      email,
                      address,
                      openingHours,
                      distance, 
                    },
                    index,
                  ) => {
                  debugger
                  return (
                      <Marker
                        key={index}
                        position={{lat,lng: lon }}
                        onClick={() => {
                          map.panTo({ lat: lat, lng: lon });
                          setActiveMarker(index);
                        }}
                        icon={{
                          url: marker_orange,
                          scaledSize: new window.google.maps.Size(25, 38)
                        }}
                      >
                        {activeMarker === index ? (
                          <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                            <div>
                              <p>{nameFormated}</p>
                              <p>{address.fullAddress}</p>
                              <p>{address.city}/{address.state}</p>
                              {phoneNumber ? (<p>Telefone: {phoneNumber}</p>) : null}
                              {whatsapp ? (<p>WhatsApp: {whatsapp}</p>): null}
                              {email ? (<p>E-mail: {email}</p>) : null}
                              <p><a>como chegar</a> - <a onClick={() => map.setZoom(15)}>Ampliar aqui</a></p>
                            </div>
                          </InfoWindow>
                        ) : null}
                      </Marker>
                    );
                })}
              </GoogleMap>)
            : <img src={ajax} />}
      </div>
      {/* {activeMarker} */}
    </div>
  );
    

  return null;
}
export default ObaMap;