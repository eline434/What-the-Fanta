// The web page inside the map's WebView. It uses MapLibre (an open-source web map) with
// OpenFreeMap (free map data: no API key, no registration, no limits). Google-based maps are
// black in Expo Go on Android (expo/expo#49323), and CARTO's free tiles now need a key.
//
// This page only DRAWS (map, shop pins, your dot) and REPORTS what happens with messages.
// All logic (Foursquare, the API key, state) stays in React Native.
//
// Messages to React Native:  { type: 'ready' } · { type: 'moved', latitude, longitude, zoom, radius } · { type: 'log', message }
//                            { type: 'selected', id } · { type: 'deselected' } · { type: 'error' }
// Functions React Native calls: setShops(shops), selectShop(id), showMe(latitude, longitude)

type MapColors = {
  pin: string;
  selectedPin: string;
  background: string;
};

export const mapHtml = ({ pin, selectedPin, background }: MapColors) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css">
  <style>
    html, body, #map { margin: 0; height: 100%; background: ${background}; }
    .pin { width: 18px; height: 18px; border-radius: 50%; background: ${pin}; border: 3px solid #fff;
           box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); box-sizing: border-box; cursor: pointer; }
    .pin.selected { background: ${selectedPin}; width: 26px; height: 26px; }
    .me { width: 16px; height: 16px; border-radius: 50%; background: #1D6BFF; border: 3px solid #fff;
          box-shadow: 0 0 0 6px rgba(29, 107, 255, 0.25); box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
  <script>
    const send = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
    // Errors inside this page are invisible on the phone: forward them to the terminal.
    window.addEventListener('error', (event) => send({ type: 'log', message: String(event.message) }));

    if (!window.maplibregl) {
      // MapLibre didn't load: no internet.
      send({ type: 'error' });
    } else {
      // Start with Belgium in view. MapLibre wants [longitude, latitude].
      const map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [4.6, 50.6],
        zoom: 6.5,
        attributionControl: { compact: true },
      });

      let markers = {};
      let selectedId = null;
      let me = null;

      const pinElement = (id) => {
        const element = document.createElement('div');
        element.className = 'pin' + (id === selectedId ? ' selected' : '');
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          send({ type: 'selected', id });
        });
        return element;
      };

      window.setShops = (shops) => {
        Object.values(markers).forEach((marker) => marker.remove());
        markers = {};
        shops.forEach((shop) => {
          markers[shop.id] = new maplibregl.Marker({ element: pinElement(shop.id) })
            .setLngLat([shop.longitude, shop.latitude])
            .addTo(map);
        });
      };

      window.selectShop = (id) => {
        if (selectedId && markers[selectedId]) markers[selectedId].getElement().classList.remove('selected');
        selectedId = id;
        if (id && markers[id]) markers[id].getElement().classList.add('selected');
      };

      window.showMe = (latitude, longitude) => {
        if (me) {
          me.setLngLat([longitude, latitude]);
        } else {
          const element = document.createElement('div');
          element.className = 'me';
          // The position FIRST: addTo() places the marker right away and fails without one.
          me = new maplibregl.Marker({ element }).setLngLat([longitude, latitude]).addTo(map);
        }
        map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 800 });
      };

      map.on('load', () => {
        // Hide the map's own shop/restaurant icons: only our Fanta shops should be on it.
        map.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith('poi')) map.setLayoutProperty(layer.id, 'visibility', 'none');
        });
        send({ type: 'ready' });
      });

      // Only when the map STOPS moving: not for every pixel while you drag.
      map.on('moveend', () => {
        const centre = map.getCenter();
        const radius = centre.distanceTo(map.getBounds().getNorthEast());
        send({ type: 'moved', latitude: centre.lat, longitude: centre.lng, zoom: map.getZoom(), radius });
      });
      // Tapping the map itself (not a pin) closes the place card.
      map.on('click', () => send({ type: 'deselected' }));
    }
  </script>
</body>
</html>`;
