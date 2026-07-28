const geoip = require("geoip-lite");
const { getCache, setCache } = require('../../config/redis');

const CACHE_TTL = 300;

const resolveIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
        const first = forwarded.split(",")[0].trim();
        if (first) return first;
    }
    return req.socket.remoteAddress || req.connection.remoteAddress;
};

const normalizeIp = (ip) => {
    if (!ip) return null;
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    return ip;
};

const getUserLocation = async (req, res) => {
    try {
        const rawIp = resolveIp(req);
        const ip = normalizeIp(rawIp);
        const location = geoip.lookup(ip);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "لوکیشن یافت نشد"
            });
        }

        if (location.country !== 'IR') {
            return res.status(403).json({
                success: false,
                message: 'لطفا سرویس VPN خودر را خاموش کنید'
            });
        }

        const cacheKey = `location:${ip}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const locationData = {
            ip: ip || rawIp,
            country: location.country,
            region: location.region,
            city: location.city,
            coordinates: location.ll
        };

        await setCache(cacheKey, locationData, CACHE_TTL);

        return res.status(200).json({
            success: true,
            data: locationData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getUserLocation
};