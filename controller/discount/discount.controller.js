const axios = require('axios');
const api = require('../../config/apis/location/location-api');
const Discount = require('../../model/Discount');

const setDiscountByLocation = async (req, res) => {
    try {
        const response = await axios.get(api.Location_Api);
        let discount = 0;
        let msg = 'شما شامل تخفیف نیستید';

        if (response.data.city === 'Tehran') {
            discount = 20;
            msg = 'چون از شهر تهران هستید شما شامل 20 درصد تخفیف روی قیمت کل شدید!';
        }
        return res.status(200).json({
            success: true,
            city: response.data.city,
            country: response.data.country,
            discount,
            message: msg
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "API Error",
            error: error.message
        });
    }
}

const getAllDiscountCodes = async (req, res) => {
    try {
        const discounts = await Discount.findAll();
        return res.status(200).json({
            success: true,
            count: discounts.length,
            data: discounts
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching discount codes",
            error: error.message
        });
    }
}

const createDiscountCode = async (req, res) => {
    try {
        const { code, percent, user_per_use } = req.body;

        if (!code || percent === undefined || percent === null) {
            return res.status(400).json({
                success: false,
                message: "code and percent are required"
            });
        }

        const discount = await Discount.create({
            code,
            percent,
            user_per_use: user_per_use || 1
        });

        return res.status(201).json({
            success: true,
            data: discount
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: "Discount code already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Error creating discount code",
            error: error.message
        });
    }
}

const deleteDiscountCode = async (req, res) => {
    try {
        const { id } = req.params;

        const discount = await Discount.findByPk(id);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount code not found"
            });
        }

        await discount.destroy();

        return res.status(200).json({
            success: true,
            message: "Discount code deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting discount code",
            error: error.message
        });
    }
}

module.exports = {setDiscountByLocation, getAllDiscountCodes, createDiscountCode, deleteDiscountCode}