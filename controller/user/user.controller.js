const axios = require('axios');
const crypto = require('crypto');
const User = require('../../model/User');
const { IranPayamak_Api, IranPayamak_Api_Key, IranPayamak_Pattern_Code, IranPayamak_Line_Number } = require('../../config/apis/user/iranpayamak-api');

const otpStore = new Map();

function generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
}

function formatPhoneNumberForSms(phone) {
    if (!phone) return phone;
    if (phone.startsWith('+98')) return phone.slice(3);
    if (phone.startsWith('0')) return phone;
    if (phone.startsWith('98')) return phone.slice(2);
    return `0${phone}`;
}

function sendOtpViaIranPayamak(phone_number, otp) {
    const recipient = formatPhoneNumberForSms(phone_number);
    return axios.post(
        `${IranPayamak_Api}/ws/v1/sms/pattern`,
        {
            code: IranPayamak_Pattern_Code,
            recipient,
            attributes: { code: otp },
            line_number: IranPayamak_Line_Number,
            number_format: 'english',
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': IranPayamak_Api_Key,
                Accept: 'application/json',
            },
        }
    );
}

const registerUser = async (req, res) => {
    try {
        const {
            plan_id,
            person_type,
            name,
            last_name,
            nation_id,
            phone_number,
            email,
            profile,
            subscription,
            discount_code,
            seller_id,
            should_notify_user,
            redirect_url,
        } = req.body;

        if (!name || !last_name || !nation_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'name, last_name, nation_id, and phone_number are required',
            });
        }

        const existingUser = await User.findOne({ where: { nation_id } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this nation_id already exists',
            });
        }

        let username = String(nation_id);

        const iranpayamakPayload = {
            plan_id: plan_id || 3,
            person_type: person_type || 'personal',
            username,
            first_name: name,
            last_name,
            national_code: String(nation_id),
            mobile: phone_number,
            discount_code: discount_code || '',
            seller_id: seller_id || null,
            should_notify_user: should_notify_user !== undefined ? should_notify_user : true,
            redirect_url: redirect_url || null,
        };

        let iranpayamakResponse;
        try {
            iranpayamakResponse = await axios.post(
                `${IranPayamak_Api}/ws/v1/auth/register`,
                iranpayamakPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Api-Key': IranPayamak_Api_Key,
                        Accept: 'application/json',
                    },
                }
            );
        } catch (iranpayamakError) {
            const hasUsernameError =
                iranpayamakError.response?.data?.error?.errors?.username ||
                (iranpayamakError.response?.data?.message && /username|نام کاربری/i.test(iranpayamakError.response.data.message));
            if (hasUsernameError) {
                username = `${name}_${nation_id}_${crypto.randomInt(100, 999)}`;
                iranpayamakPayload.username = username;
                iranpayamakPayload.national_code = String(nation_id);

                iranpayamakResponse = await axios.post(
                    `${IranPayamak_Api}/ws/v1/auth/register`,
                    iranpayamakPayload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Api-Key': IranPayamak_Api_Key,
                            Accept: 'application/json',
                        },
                    }
                );
            } else {
                throw iranpayamakError;
            }
        }

        const user = await User.create({
            name,
            last_name,
            nation_id,
            phone_number,
            email: email || null,
            profile: profile || '',
            subscription: subscription || null,
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    last_name: user.last_name,
                    nation_id: user.nation_id,
                    phone_number: user.phone_number,
                    email: user.email,
                    profile: user.profile,
                    subscription: user.subscription,
                },
                iranpayamak_response: iranpayamakResponse.data,
            },
        });
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.message || 'IranPayamak API error',
                error: error.response.data,
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Registration error',
            error: error.message,
        });
    }
};

const requestOtp = async (req, res) => {
    try {
        const { phone_number } = req.body;

        if (!phone_number) {
            return res.status(400).json({
                success: false,
                message: 'phone_number is required',
            });
        }

        const user = await User.findOne({ where: { phone_number } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const otp = generateOtp();
        const otpKey = `otp_${user.id}`;
        otpStore.set(otpKey, { otp, attempts: 0, maxAttempts: 5, expiresAt: Date.now() + 5 * 60 * 1000 });

        await sendOtpViaIranPayamak(user.phone_number, otp);

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: { user_id: user.id },
        });
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.message || 'OTP request error',
                error: error.response.data,
            });
        }
        return res.status(500).json({
            success: false,
            message: 'OTP request error',
            error: error.message,
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { user_id, otp } = req.body;

        if (!user_id || !otp) {
            return res.status(400).json({
                success: false,
                message: 'user_id and otp are required',
            });
        }

        const otpKey = `otp_${user_id}`;
        const otpData = otpStore.get(otpKey);

        if (!otpData) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.',
            });
        }

        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(otpKey);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        if (otpData.attempts >= otpData.maxAttempts) {
            otpStore.delete(otpKey);
            return res.status(400).json({
                success: false,
                message: 'Maximum OTP attempts reached. Please request a new one.',
            });
        }

        otpData.attempts += 1;

        if (otp !== otpData.otp) {
            otpStore.set(otpKey, otpData);
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.`,
            });
        }

        otpStore.delete(otpKey);

        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    last_name: user.last_name,
                    nation_id: user.nation_id,
                    phone_number: user.phone_number,
                    email: user.email,
                    profile: user.profile,
                    subscription: user.subscription,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'OTP verification error',
            error: error.message,
        });
    }
};

module.exports = { registerUser, requestOtp, verifyOtp };