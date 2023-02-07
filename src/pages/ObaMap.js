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
  const [cep, setCep] = useState('');
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [centerPosition, setCenterPosition] = useState({ lat: -23.5502, lng: -46.63617 }); // Praça da SÉ

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBt5L6L3JKtIocOLj_9dkgDmhDJYIAEQ9s"
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
    debugger

    const result = await axios.get(
      `https://obaecommerce.hubin.io/iomanager/api/flows/execute/route/store-finder/stores-list?lat=${lat}&lon=${lng}`,
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

    debugger
    setMarkers(dataFormated);
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
            axios(`https://viacep.com.br/ws/${cep}/json/`)
              .then(res => {
                let url = `https://maps.googleapis.com/maps/api/geocode/json?address=+${res.data.logradouro},+${res.data.localidade},+${res.data.uf}&key=AIzaSyBt5L6L3JKtIocOLj_9dkgDmhDJYIAEQ9s`;
                axios.post(url)
                  .then(res => {
                    if (res.status === 200) {
                      setCenterPosition(res.data.results[0].geometry.location);
                      map.panTo(res.data.results[0].geometry.location);
                      debugger
                      fetchData(res.data.results[0].geometry.location.lat, res.data.results[0].geometry.location.lng);
                    } else if (res.status === "ZERO_RESULTS") {
                      alert('Unable to process this location. Please revise location fields and try submitting again.')
                    }
                  })
              });

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