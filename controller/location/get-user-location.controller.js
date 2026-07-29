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

const isPrivateIp = (ip) => {
    if (!ip) return true;
    if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") return true;
    if (ip.startsWith("10.")) return true;
    if (ip.startsWith("192.168.")) return true;
    if (ip.startsWith("172.")) {
        const parts = ip.split(".");
        if (parts.length === 4) {
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 16 && secondOctet <= 31) return true;
        }
    }
    return false;
};

const getUserLocation = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const rawIp = resolveIp(req);
        const ip = normalizeIp(rawIp);

        if (isPrivateIp(ip)) {
            return res.status(200).json({
                success: true,
                data: {
                    ip: ip || rawIp,
                    country: "IR",
                    region: "Tehran",
                    city: "Tehran",
                    coordinates: [35.6892, 51.3890],
                    private: true
                }
            });
        }

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