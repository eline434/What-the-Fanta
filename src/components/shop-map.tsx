import { useImperativeHandle, useRef, type Ref } from 'react';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { Coordinates, Place } from '@/lib/foursquare';
import { mapHtml } from '@/lib/map-html';
import { Colors } from '@/constants/theme';

export type MapRegion = Coordinates & {
  zoom: number;
  radius: number; // metres from the centre to the corner of the screen
};

// What the screen can tell the map to do (called from event handlers, never from a useEffect).
export type ShopMapHandle = {
  showShops: (shops: Place[]) => void;
  selectShop: (id: string | null) => void;
  showMe: (position: Coordinates) => void;
};

type ShopMapProps = {
  ref?: Ref<ShopMapHandle>;
  onReady: () => void;
  onMoved: (region: MapRegion) => void;
  onSelect: (id: string | null) => void;
  onFailed: () => void;
};

// Built once, outside the component: if the WebView got a new `source` object on every render,
// it could reload the whole map each time.
const colors = Colors.light;
const MAP_SOURCE = {
  html: mapHtml({ pin: colors.primary, selectedPin: colors.accent, background: colors.backgroundSelected }),
};

// Turns the WebView's messages into normal props (onMoved, onSelect, …), so the screen using it
// never has to know there's a web page inside.
export function ShopMap({ ref, onReady, onMoved, onSelect, onFailed }: ShopMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Runs a line of JavaScript inside the web page. `true;` at the end is required by the WebView.
  const run = (code: string) => webViewRef.current?.injectJavaScript(`${code}; true;`);

  // A ref (like cameraRef before) gives the screen these three functions.
  useImperativeHandle(ref, () => ({
    // Only what the page needs to draw a pin: not the whole Foursquare answer.
    showShops: (shops) =>
      run(`window.setShops(${JSON.stringify(shops.map(({ id, latitude, longitude }) => ({ id, latitude, longitude })))})`),
    selectShop: (id) => run(`window.selectShop(${JSON.stringify(id)})`),
    showMe: ({ latitude, longitude }) => run(`window.showMe(${Number(latitude)}, ${Number(longitude)})`),
  }));

  // Messages from the web page are untrusted input: check their shape before using them.
  const handleMessage = (event: WebViewMessageEvent) => {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message.type === 'log' && typeof message.message === 'string') {
      // A JavaScript error inside the map page: show it in the terminal.
      console.warn('[map page]', message.message);
    } else if (message.type === 'ready') {
      onReady();
    } else if (message.type === 'error') {
      onFailed();
    } else if (message.type === 'selected' && typeof message.id === 'string') {
      onSelect(message.id);
    } else if (message.type === 'deselected') {
      onSelect(null);
    } else if (
      message.type === 'moved' &&
      typeof message.latitude === 'number' &&
      typeof message.longitude === 'number' &&
      typeof message.zoom === 'number' &&
      typeof message.radius === 'number'
    ) {
      onMoved({ latitude: message.latitude, longitude: message.longitude, zoom: message.zoom, radius: message.radius });
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={MAP_SOURCE}
      originWhitelist={['*']}
      onMessage={handleMessage}
      onError={onFailed}
      // The map sits inside the scrolling Home list: let dragging on the map move the map.
      nestedScrollEnabled
      style={{ flex: 1, backgroundColor: colors.backgroundSelected }}
    />
  );
}
