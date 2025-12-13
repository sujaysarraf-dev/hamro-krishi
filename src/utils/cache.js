import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'app_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache utility for storing and retrieving data with expiration
 */
export const cache = {
    /**
     * Get cached data if it exists and is not expired
     * @param {string} key - Cache key
     * @returns {Promise<Object|null>} Cached data or null
     */
    async get(key) {
        try {
            const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is expired
            if (now - timestamp > CACHE_DURATION) {
                await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    /**
     * Store data in cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    async set(key, data) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },

    /**
     * Remove cached data
     * @param {string} key - Cache key
     */
    async remove(key) {
        try {
            await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    },

    /**
     * Clear all cache
     */
    async clear() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
};

