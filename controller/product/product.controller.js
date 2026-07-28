const Product = require('../../model/Product');
const { getCache, setCache, deleteCache } = require('../../config/redis');

const CACHE_TTL = 60;

const serializeProduct = (product) => {
    const value = product && typeof product.toJSON === 'function' ? product.toJSON() : product;

    return {
        ...value,
        image_url: value.image || '',
        stock: value.is_stock ? 1 : 0,
        is_active: value.is_active !== undefined ? value.is_active : true,
        description: value.description || '',
        category: value.category || '',
    };
};

const getAllProducts = async (req, res) => {
    try {
        const cacheKey = 'products:all';
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                count: cached.length,
                data: cached,
                cached: true
            });
        }

        const products = await Product.findAll();
        await setCache(cacheKey, products.map(serializeProduct), CACHE_TTL);

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products.map(serializeProduct)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, price, image_url, stock, description, category } = req.body;

        if (!name || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                message: "name and price are required"
            });
        }

        const product = await Product.create({
            name,
            price,
            image: image_url || "",
            is_stock: stock === undefined ? true : Number(stock) > 0,
            description: description || '',
            category: category || '',
        });

        await deleteCache('products:all');

        return res.status(201).json({
            success: true,
            data: serializeProduct(product)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating product",
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, image_url, stock, description, category } = req.body;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (price !== undefined) updates.price = price;
        if (image_url !== undefined) updates.image = image_url;
        if (stock !== undefined) updates.is_stock = Number(stock) > 0;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;

        await product.update(updates);

        await deleteCache('products:all');

        return res.status(200).json({
            success: true,
            data: serializeProduct(product)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating product",
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.destroy();

        await deleteCache('products:all');

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting product",
            error: error.message
        });
    }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };