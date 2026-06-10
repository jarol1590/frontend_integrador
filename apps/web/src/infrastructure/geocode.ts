export interface GeocodingResult {
    lat: number
    lng: number
}

export async function geocodeAddress(direccion: string, municipio: string, departamento: string): Promise<GeocodingResult | null> {
    const query = `${direccion}, ${municipio}, ${departamento}, Colombia`
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'ProyectoIntegrador/1.0' } },
    )
    if (!response.ok) return null
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}
