const Order = require('../models/Order');
const Product = require('../models/Product');

// Generates a collision-resistant order number using a timestamp + random suffix
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${suffix}`;
};

// @desc  Get all orders
// @route GET /api/orders
// @access Protected
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name sku category price')
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single order by ID
// @route GET /api/orders/:id
// @access Protected
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'items.product',
      'name sku category price supplier'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a new order — validates stock, deducts quantities, auto-generates orderNumber
// @route POST /api/orders
// @access Protected
const createOrder = async (req, res) => {
  const { customer, items } = req.body;

  if (!customer || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'customer and a non-empty items array are required' });
  }

  try {
    let totalAmount = 0;
    const resolvedItems = [];

    // Validate stock availability for every item before touching any product
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: 'Each item requires a valid product ID and quantity >= 1' });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: `Product with id "${item.product}" not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.quantity}`,
        });
      }

      const unitPrice = item.price !== undefined ? item.price : product.price;
      totalAmount += unitPrice * item.quantity;

      resolvedItems.push({ product: item.product, quantity: item.quantity, price: unitPrice });
    }

    // Persist the order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer,
      items: resolvedItems,
      totalAmount,
    });

    // Deduct stock — happens after the order is created to avoid orphaned stock reductions
    for (const item of resolvedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    const populated = await Order.findById(order._id).populate(
      'items.product',
      'name sku category price'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update the status of an order
// @route PUT /api/orders/:id/status
// @access Admin
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    const updated = await order.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus };
