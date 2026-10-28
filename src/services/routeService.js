const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// const ORS_URL =
//   "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson";
// const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export const routeService = {
  /**
   * Geocode a place name to coordinates using Nominatim
   */
  async getCoordinates(place) {
    // Check if the place is already coordinates (e.g. "lat, lon" or "lat,lon")
    const coordRegex = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;
    const match = place.trim().match(coordRegex);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lon: parseFloat(match[2]),
        displayName: 'Specified Location'
      };
    }

    const response = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(place)}&accept-language=en`, {
      headers: {
        'User-Agent': 'WomenSafetyApp/1.0'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    throw new Error('Location not found');
  },

  /**
   * Get foot-walking route from OpenRouteService avoiding danger zones
   */
  async getRoute(start, end, incidents = []) {
    const apiKey = import.meta.env.VITE_OPENROUTESERVICE_KEY;
    if (!apiKey) {
      throw new Error('OpenRouteService API key not found in .env. Please add VITE_OPENROUTESERVICE_KEY.');
    }
    
    // Create danger zones (polygons) around incidents (approx 100x100m bounding box)
    const polygons = incidents.map(inc => {
      const d = 0.001; // ~111 meters
      const lat = parseFloat(inc.lat);
      const lon = parseFloat(inc.lon);
      return [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d]
      ];
    });

    const body = {
      coordinates: [[start.lon, start.lat], [end.lon, end.lat]]
    };

    if (polygons.length > 0) {
      body.options = {
        avoid_polygons: {
          type: "MultiPolygon",
          coordinates: [polygons] // MultiPolygon requires [[[lon, lat]]] format
        }
      };
    }

    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    console.log(response, "response")
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to fetch safe route');
    }
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    throw new Error('Route not found');
  },

  /**
   * Fetch nearby amenities using Overpass API (OpenStreetMap)
   * This makes the safety data REAL and dynamic.
   */
  // async getNearbyAmenities(lat, lon, type, radius = 5000, retries = 3) {
  //   const query = `[out:json];node["amenity"="${type}"](around:${radius},${lat},${lon});out;`;
  //   try {
  //     const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`);
  //     if (!response.ok) throw new Error('Overpass API returned ' + response.status);
  //     const data = await response.json();
  //     return data.elements || [];
  //   } catch (error) {
  //     if (retries > 0) {
  //       console.warn(`Retrying Overpass API for ${type}... (${retries} left)`);
  //       // Wait 1 second before retrying
  //       await new Promise(res => setTimeout(res, 1000));
  //       return this.getNearbyAmenities(lat, lon, type, radius, retries - 1);
  //     }
  //     console.error(`Failed to fetch ${type}:`, error);
  //     return [];
  //   }
  // },


  
async getNearbyAmenities(lat, lon, type, radius = 1000, retries = 3) {
  const query =
    `[out:json][timeout:25];` +
    `nwr["amenity"="${type}"]` +
    `(around:${radius},${lat},${lon});` +
    `out center;`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }),
      });

      if (!response.ok) {
        const message = await response.text();

        if (
          ![429, 502, 503, 504].includes(response.status) ||
          attempt === retries
        ) {
          throw new Error(
            `Overpass API ${response.status}: ${message}`
          );
        }

        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = retryAfter > 0
          ? retryAfter * 1000
          : 3000 * Math.pow(2, attempt);

        console.warn(
          `Overpass unavailable (${response.status}). Retrying in ${delay}ms`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const data = await response.json();

      if (data.remark) {
        console.warn("Overpass query warning:", data.remark);
      }

      return (data.elements || []).map(element => ({
        ...element,
        lat: element.lat ?? element.center?.lat,
        lon: element.lon ?? element.center?.lon,
      }));

    } catch (error) {
      if (attempt === retries) {
        console.error(
          `Failed to fetch ${type}:`,
          error.message
        );
        return [];
      }

      if (error.message.startsWith("Overpass API ")) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 3000 * Math.pow(2, attempt))
      );
    }
  }

  return [];
},

  /**
   * Calculate a dynamic safety score based on route conditions and nearby safety infrastructure
   */
  calculateSafetyScore(routeFeature, policeStations, hospitals) {
    let score = 75; // Base score
    
    // 1. Reward for nearby police stations
    if (policeStations.length > 0) {
      score += Math.min(policeStations.length * 5, 15); // Max +15
    }
    
    // 2. Reward for nearby hospitals
    if (hospitals.length > 0) {
      score += Math.min(hospitals.length * 2, 10); // Max +10
    }
    
    // 3. Analyze route distance/duration
    const distance = routeFeature.properties.summary.distance / 1000; // km
    if (distance > 20) {
      score -= 10; // Longer routes are generally riskier at night
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    let riskLevel = 'Moderate Risk';
    let corridorStatus = 'Standard Corridor';
    
    if (score >= 85) {
      riskLevel = 'Highly Safe';
      corridorStatus = 'Secure Corridor';
    } else if (score < 60) {
      riskLevel = 'Unsafe Route';
      corridorStatus = 'Caution Required';
    }
    
    return {
      score,
      riskLevel,
      corridorStatus
    };
  }
};
