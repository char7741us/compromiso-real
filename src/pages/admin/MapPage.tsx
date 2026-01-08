import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useVoters } from '../../context/VoterContext';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Municipalities Coordinates (Approximated for Atlántico, Colombia)
const MUNICIPALITY_COORDS: { [key: string]: [number, number] } = {
    'BARRANQUILLA': [10.9639, -74.7964],
    'SOLEDAD': [10.9169, -74.7706],
    'GALAPA': [10.8981, -74.8875],
    'PUERTO COLOMBIA': [11.0119, -74.8833],
    'MALAMBO': [10.8586, -74.7739],
    'SABANALARGA': [10.6311, -74.9206],
    'BARANOA': [10.7936, -74.9161],
    'REPELÓN': [10.4939, -75.1278],
    'SITIONUEVO': [10.7788, -74.7214],
    'SANTA BARBARA': [5.8725, -75.5658],
    'SABANAGRANDE': [10.7958, -74.7497]
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export default function MapPage() {
    const { voters, isLoading } = useVoters();
    const [mapCenter, setMapCenter] = useState<[number, number]>([10.85, -74.85]);
    const [zoom, setZoom] = useState(10);
    const CENTER: [number, number] = [10.85, -74.85];

    const markers = useMemo(() => {
        const counts: { [key: string]: { count: number, municipality: string, coords: [number, number] | null } } = {};
        voters.forEach(v => {
            const mun = (v['MUNICIPIO RESIDENCIA'] || v['MUNICIPIO VOTACIÓN'] || 'DESCONOCIDO').toUpperCase().trim();
            if (!counts[mun]) {
                counts[mun] = { count: 0, municipality: mun, coords: MUNICIPALITY_COORDS[mun] || null };
            }
            counts[mun].count++;
        });
        return Object.values(counts).sort((a, b) => b.count - a.count);
    }, [voters]);

    const handleMunicipalityClick = (_municipality: string, coords: [number, number]) => {
        setMapCenter(coords);
        setZoom(13);
    };

    if (isLoading && voters.length === 0) {
        return (
            <div className="container-padding">
                <SkeletonLoader type="text" count={2} />
                <SkeletonLoader type="table" count={10} />
            </div>
        );
    }

    return (
        <div className="map-page">
            <AdminHeader
                title="Mapa Territorial"
                description="Visualización de la densidad electoral por municipio en el Atlántico."
            />

            <div className="grid-charts grid-map">
                <div className="card map-container-wrapper p-0">
                    <MapContainer center={CENTER} zoom={9} scrollWheelZoom={true} className="map-container">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ChangeView center={mapCenter} zoom={zoom} />
                        {markers.map((marker, idx) => (
                            marker.coords && (
                                <CircleMarker
                                    key={idx}
                                    center={marker.coords}
                                    radius={Math.min(25, 8 + (marker.count / 10))}
                                    fillColor="#2563eb"
                                    color="#1e40af"
                                    weight={1}
                                    opacity={0.8}
                                    fillOpacity={0.4}
                                >
                                    <Popup>
                                        <div className="popup-content">
                                            <strong>{marker.municipality}</strong><br />
                                            Votantes: {marker.count}
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            )
                        ))}
                    </MapContainer>
                </div>

                <div className="card map-sidebar">
                    <h3 className="section-title">Ranking por Municipio</h3>
                    <div className="municipality-list">
                        {markers.map((m, i) => (
                            <div
                                key={i}
                                className={`municipality-item flex-between ${!m.coords ? 'municipality-empty' : ''}`}
                                onClick={() => m.coords && handleMunicipalityClick(m.municipality, m.coords)}
                            >
                                <div className="flex-between gap-2">
                                    <div className="municipality-rank">{i + 1}</div>
                                    <div className="municipality-info">
                                        <div className="font-600 text-sm">{m.municipality}</div>
                                        <div className="text-muted text-xs">{m.count} votantes</div>
                                    </div>
                                </div>
                                {!m.coords && <div className="geo-missing">Sin geo</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
