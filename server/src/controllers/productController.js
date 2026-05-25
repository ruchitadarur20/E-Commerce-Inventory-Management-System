const Product = require('../models/Product');

// @desc  Get all products — supports ?name=, ?category=, ?page=, ?limit= query params
// @route GET /api/products
// @access Protected
const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single product by ID
// @route GET /api/products/:id
// @access Protected
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a new product
// @route POST /api/products
// @access Admin
const createProduct = async (req, res) => {
  const { name, sku, category, quantity, price, lowStockThreshold, supplier, description } = req.body;

  if (!name || !sku || !category || quantity === undefined || price === undefined) {
    return res.status(400).json({ message: 'name, sku, category, quantity, and price are required' });
  }

  try {
    const skuExists = await Product.findOne({ sku: sku.toUpperCase() });
    if (skuExists) {
      return res.status(400).json({ message: `A product with SKU "${sku}" already exists` });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      quantity,
      price,
      lowStockThreshold,
      supplier,
      description,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update an existing product
// @route PUT /api/products/:id
// @access Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a product
// @route DELETE /api/products/:id
// @access Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all products where quantity is at or below their lowStockThreshold
// @route GET /api/products/low-stock
// @access Protected
const getLowStockProducts = async (req, res) => {
  try {
    // $expr allows comparing two fields within the same document
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).sort({ quantity: 1 });

    res.json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
