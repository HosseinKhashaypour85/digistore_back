const CartItem = require('../../model/Cart');
const Product = require('../../model/Product');
const { getCache, setCache, deleteCache } = require('../../config/redis');

const CACHE_TTL = 60;

const getCartItems = async (req, res) => {
    try {
        const { session_id } = req.query;
        const where = {};
        if (session_id) where.session_id = session_id;

        const cacheKey = session_id ? `cart:session:${session_id}` : 'cart:all';
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                count: cached.length,
                data: cached,
                cached: true
            });
        }

        const cartItems = await CartItem.findAll({
            where,
            include: [{
                model: Product,
                as: "product",
                required: true
            }]
        });

        await setCache(cacheKey, cartItems, CACHE_TTL);

        return res.status(200).json({
            success: true,
            count: cartItems.length,
            data: cartItems
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching cart items",
            error: error.message
        });
    }
};

const addToCart = async (req, res) => {
    try {
        const { session_id, product_id, quantity } = req.body;

        if (!session_id || !product_id) {
            return res.status(400).json({
                success: false,
                message: "session_id and product_id are required"
            });
        }

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const existingItem = await CartItem.findOne({ where: { session_id, product_id } });

        if (existingItem) {
            await existingItem.update({
                quantity: existingItem.quantity + (quantity || 1)
            });
            await deleteCache(`cart:session:${session_id}`);
            await deleteCache('cart:all');
            return res.status(200).json({
                success: true,
                data: existingItem
            });
        }

        const cartItem = await CartItem.create({
            session_id,
            product_id,
            quantity: quantity || 1
        });

        await deleteCache(`cart:session:${session_id}`);
        await deleteCache('cart:all');

        return res.status(201).json({
            success: true,
            data: cartItem
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error adding to cart",
            error: error.message
        });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const cartItem = await CartItem.findByPk(id);

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        if (quantity === undefined || quantity === null || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Valid quantity is required"
            });
        }

        await cartItem.update({ quantity });

        await deleteCache(`cart:session:${cartItem.session_id}`);
        await deleteCache('cart:all');

        return res.status(200).json({
            success: true,
            data: cartItem
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating cart item",
            error: error.message
        });
    }
};

const deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;

        const cartItem = await CartItem.findByPk(id);

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        const sessionId = cartItem.session_id;

        await cartItem.destroy();

        await deleteCache(`cart:session:${sessionId}`);
        await deleteCache('cart:all');

        return res.status(200).json({
            success: true,
            message: "Cart item deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting cart item",
            error: error.message
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: "session_id is required"
            });
        }

        await CartItem.destroy({ where: { session_id } });

        await deleteCache(`cart:session:${session_id}`);
        await deleteCache('cart:all');

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error clearing cart",
            error: error.message
        });
    }
};

module.exports = { getCartItems, addToCart, updateCartItem, deleteCartItem, clearCart };