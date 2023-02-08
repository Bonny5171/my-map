import React, { useState, useEffect, } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, } from '@react-google-maps/api';
// import axios from 'axios';
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

const keyMap = "AIzaSyBt5L6L3JKtIocOLj_9dkgDmhDJYIAEQ9s";

const ObaMap = () => {
  const [map, setMap] = React.useState(null)
  const [error, setError] = useState(null);
  const [cep, setCep] = useState('');
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [centerPosition, setCenterPosition] = useState({ lat: -23.5502, lng: -46.63617 }); // Praça da SÉ

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: keyMap,
  });

  const onChange = ({ coords, timestamp }) => {
    setCenterPosition({ lat: coords.latitude, lng: coords.longitude })
  };

  const onError = (error) => {
    setError(error.message);
  };

  const fetchLocation = () => {
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
  }


  useEffect(() => {
    // Pega localização
    fetchLocation();

    // Pega os markers
    fetchData();
  }, []);

  const fetchData = async (lat = centerPosition.lat, lng = centerPosition.lng) => {
    const url = `https://obaecommerce.hubin.io/iomanager/api/flows/execute/route/store-finder/stores-list?lat=${lat}&lon=${lng}`;
    const options = {
      method: 'GET',
      headers: {
        'x-wevo-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzZi10b2tlbi0yIiwidGVuYW50Ijoib2JhZWNvbW1lcmNlIiwidHlwZVRva2VuIjoiMiIsImV4cCI6MTY5NzA1MTYwMjM5N30.niQrh7kR8Pd_GavQDZqY4GlKcVlm6d5fxlkdi0p-qMA',
      },
    };

    fetch( url, options )
      .then(response => response.json())
      .then((result) => {
        const dataFormated = result.map(element => {
          const nameSlited = element.name.split('-')[1];
          return {
            nameFormated: nameSlited,
            ...element,
          }
        });
        setMarkers(dataFormated);
      });

  };

  const onUnmount = React.useCallback(() => setMap(null), []);

  console.log('markersmarkers', markers.length);

  return (
    <div style={{ display: 'flex' }}>

      {/* LISTA DE LOJAS */}
      {(markers.length > 0) ? (<ul>{markers.map((item, index) => (<li
        key={index}
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
      </li>))}</ul>) : <img src={ajax} alt="Carregando..." style={{ width: 20, height: 20, }} />}

      <div>
        <label>Digite seu CEP ou endereço:
          <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} />
        </label>
        <button
          onClick={() => {            
            const isValidBRZip = zip => /^([\d]{2})([\d]{3})([\d]{3})|^[\d]{2}.[\d]{3}-[\d]{3}/.test(zip);
            if (!isValidBRZip(cep)) {
              // BUSCA POR ENDEREÇO
              let url = `https://maps.googleapis.com/maps/api/geocode/json?address=+${cep}&key=${keyMap}`;
                fetch(url, { method: 'POST' })
                  .then(response => response.json())
                  .then(res => {
                    debugger
                    if (res.status === "OK") {
                      setCenterPosition(res.results[0].geometry.location);
                      map.panTo(res.results[0].geometry.location);
                      fetchData(res.results[0].geometry.location.lat, res.results[0].geometry.location.lng);
                    } else if (res.status === "ZERO_RESULTS") {
                      alert('Nenhuma unidade encontrada')
                    }
                  })
            } else {
              // BUSCA POR CEP
              const txtFormated = cep.replace('-', '').trim();
              fetch(`https://viacep.com.br/ws/${txtFormated}/json/`)
                .then(response => response.json())
                .then(res => {
                  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=+${res.logradouro},+${res.localidade},+${res.uf}&key=${keyMap}`;
                  fetch(url, { method: 'POST' })
                    .then(response => response.json())
                    .then(res => {
                      if (res.status === "OK") {
                        setCenterPosition(res.results[0].geometry.location);
                        map.panTo(res.results[0].geometry.location);
                        fetchData(res.results[0].geometry.location.lat, res.results[0].geometry.location.lng);
                      } else if (res.status === "ZERO_RESULTS") {
                        alert('Nenhuma unidade encontrada')
                      }
                    })
                });
            }
          }}
        >Atualizar</button>
      </div>

      {/* MAP */}
      <div>
        {isLoaded
          ? (<GoogleMap
            onLoad={map => setMap(map)}
            mapContainerStyle={{ width: '1000px', height: '600px' }}
            center={centerPosition}
            zoom={15}
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
              key={Math.random().toString(7).slice(2, 7)}
              position={centerPosition}
              onClick={() => setActiveMarker(null)}
              icon={{ url: marker_pink, scaledSize: new window.google.maps.Size(25, 38) }}
            />
            {markers.map((
              { lat, lon, nameFormated, storeNumber, phoneNumber, whatsapp, email, address, },
              index,
            ) => (
              <Marker
                key={index}
                position={{ lat, lng: lon }}
                onClick={() => {
                  map.panTo({ lat: lat, lng: lon });
                  setActiveMarker(index);
                }}
                icon={{ url: marker_orange, scaledSize: new window.google.maps.Size(25, 38) }}
              >
                {activeMarker === index ? (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                    <div>
                      <p>{nameFormated}</p>
                      <p>{address.fullAddress}</p>
                      <p>{address.city}/{address.state}</p>
                      {phoneNumber ? (<p>Telefone: {phoneNumber}</p>) : null}
                      {whatsapp ? (<p>WhatsApp: {whatsapp}</p>) : null}
                      {email ? (<p>E-mail: {email}</p>) : null}
                      <p>
                        <span onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${centerPosition.lat},${centerPosition.lon}&destination=${lat},${lon}`,'_blank','noopener')}>como chegar</span> - 
                        <span onClick={() => map.setZoom(15)}>Ampliar aqui</span></p>
                    </div>
                  </InfoWindow>
                ) : null}
              </Marker>
            ))}
          </GoogleMap>)
          : <img src={ajax} alt="Carregando..." />}
      </div>

    </div>
  );
}
export default ObaMap;