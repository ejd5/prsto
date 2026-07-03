'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ZoneData {
  id: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  color: string;
}

interface MapViewProps {
  zones: ZoneData[];
  selectedZone: string | null;
  onZoneClick: (id: string | null) => void;
}

function MapClickHandler({ onZoneClick }: { onZoneClick: (id: string | null) => void }) {
  useMapEvents({
    click: () => onZoneClick(null),
  });
  return null;
}

function FitMapToContainer() {
  const map = useMap();
  const fitted = useRef(false);

  const fit = useCallback(() => {
    const container = map.getContainer();
    if (!container) return;
    const w = container.clientWidth;
    if (w <= 0) return;
    // One world width at given zoom = 256 * 2^zoom
    // We want world > container width so tiles always reach edges
    const zoom = Math.log2(w / 256) + 0.15;
    map.setView([0, 0], zoom, { animate: false });
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      fit();
    });
    ro.observe(container);
    map.whenReady(() => {
      fit();
      fitted.current = true;
    });
    return () => ro.disconnect();
  }, [map, fit]);

  return null;
}

export default function MapView({ zones, selectedZone, onZoneClick }: MapViewProps) {
  return (
    <div style={{ height: '500px', width: '100%', background: '#090909' }}>
      <MapContainer
        center={[0, 0]}
        zoom={1}
        maxZoom={6}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#090909' }}
      >
        <TileLayer
          attribution=''
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitMapToContainer />
        <ZoomControl position="bottomright" />
        <MapClickHandler onZoneClick={onZoneClick} />
        {zones.filter(z => z.id !== 'remote').map((zone) => {
          const isSelected = selectedZone === zone.id;
          return (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={isSelected ? 22 : Math.max(8, Math.min(28, zone.count * 2.5 + 6))}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: isSelected ? 0.4 : 0.15,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  onZoneClick(isSelected ? null : zone.id);
                },
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <span className="font-mono text-xs font-bold whitespace-nowrap" style={{ color: zone.color }}>
                  {zone.label} {zone.count > 0 ? `(${zone.count})` : ''}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
        {(() => {
          const zone = zones.find(z => z.id === 'remote');
          if (!zone) return null;
          const isSelected = selectedZone === 'remote';
          return (
            <>
              <CircleMarker
                center={[28, -42]}
                radius={isSelected ? 28 : 20}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: isSelected ? 0.4 : 0.18,
                  weight: isSelected ? 3 : 2,
                  dashArray: '4, 6',
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    onZoneClick(isSelected ? null : 'remote');
                  },
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  <span className="font-mono text-xs font-bold whitespace-nowrap" style={{ color: zone.color }}>
                    Remote {zone.count > 0 ? `(${zone.count})` : ''}
                  </span>
                </Tooltip>
              </CircleMarker>
              <CircleMarker
                center={[28, -42]}
                radius={isSelected ? 34 : 26}
                pathOptions={{
                  color: zone.color,
                  fillOpacity: 0.04,
                  weight: 1,
                  dashArray: '2, 8',
                }}
                interactive={false}
              />
            </>
          );
        })()}
      </MapContainer>
    </div>
  );
}
