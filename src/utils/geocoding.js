/**
 * Reverse geocoding utility using OpenStreetMap Nominatim API
 * This replaces the deprecated expo-location reverseGeocodeAsync
 */

/**
 * Reverse geocode coordinates to get location name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Location name or 'Current Location' if not found
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'SmartFarmApp/1.0', // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        
        if (!data || !data.address) {
            return 'Current Location';
        }

        const address = data.address;
        const locationParts = [];

        // Build location name from most specific to least specific
        if (address.road || address.street) {
            locationParts.push(address.road || address.street);
        } else if (address.suburb || address.neighbourhood) {
            locationParts.push(address.suburb || address.neighbourhood);
        } else if (address.village || address.town) {
            locationParts.push(address.village || address.town);
        }

        if (address.city || address.town || address.municipality) {
            const city = address.city || address.town || address.municipality;
            if (!locationParts.includes(city)) {
                locationParts.push(city);
            }
        }

        if (address.state || address.region) {
            const state = address.state || address.region;
            if (!locationParts.includes(state)) {
                locationParts.push(state);
            }
        }

        // If we still don't have enough info, add country
        if (locationParts.length === 0 && address.country) {
            locationParts.push(address.country);
        }

        return locationParts.length > 0 ? locationParts.join(', ') : 'Current Location';
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return 'Current Location';
    }
};

