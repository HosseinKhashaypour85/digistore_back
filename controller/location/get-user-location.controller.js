const geoip = require("geoip-lite");

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

        return res.status(200).json({
            success: true,
            data: {
                ip: ip || rawIp,
                country: location.country,
                region: location.region,
                city: location.city,
                coordinates: location.ll
            }
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