const { Product } = require('../models/tradeItem');

const getAllProducts = async (req, res) => {
    const products = await Product.find({});
    if(!products) {
      res.status(500).json({ success: false });
    }
    res.send(products);
};

const createProduct = async (req, res) => {
    const newProduct = new Product({
        name: req.body.name,
        image: req.body.image,
        countInStock: req.body.countInStock,
    });

    try {
        const createdProduct = await newProduct.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        res.status(500).json({
            error: err,
            success: false,
        });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
};
