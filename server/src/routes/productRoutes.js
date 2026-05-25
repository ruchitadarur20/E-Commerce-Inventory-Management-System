const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// /low-stock must be defined before /:id so Express doesn't treat "low-stock" as an ID
router.get('/low-stock', protect, getLowStockProducts);

router.route('/')
  .get(protect, getProducts)
  .post(protect, adminOnly, createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;
