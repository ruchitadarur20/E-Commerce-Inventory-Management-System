require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const USERS = [
  {
    name: 'Sarah Chen',
    email: 'admin@demo.com',
    password: 'demo1234',
    role: 'admin',
  },
  {
    name: 'James Park',
    email: 'viewer@demo.com',
    password: 'demo1234',
    role: 'viewer',
  },
];

const PRODUCTS = [
  { name: 'iPhone 15 Case',       sku: 'CASE-001', category: 'Accessories', quantity: 45, price: 19.99,  lowStockThreshold: 10 },
  { name: 'USB-C Hub 7-Port',     sku: 'HUB-001',  category: 'Electronics', quantity: 8,  price: 49.99,  lowStockThreshold: 10 },
  { name: 'Wireless Mouse',       sku: 'MSE-001',  category: 'Electronics', quantity: 23, price: 34.99,  lowStockThreshold: 5  },
  { name: 'Laptop Stand Aluminum',sku: 'STD-001',  category: 'Accessories', quantity: 4,  price: 79.99,  lowStockThreshold: 5  },
  { name: 'HDMI Cable 2m',        sku: 'CBL-001',  category: 'Cables',      quantity: 67, price: 12.99,  lowStockThreshold: 15 },
  { name: 'Mechanical Keyboard',  sku: 'KBD-001',  category: 'Electronics', quantity: 3,  price: 129.99, lowStockThreshold: 5  },
];

const seed = async () => {
  await connectDB();

  // ── Users ────────────────────────────────────────────────────────────────
  let usersCreated = 0;

  for (const userData of USERS) {
    try {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`  [skip] user already exists: ${userData.email}`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.create({ ...userData, password: hashedPassword });
      console.log(`  [+] created user: ${userData.name} <${userData.email}> (${userData.role})`);
      usersCreated++;
    } catch (error) {
      console.error(`  [error] user ${userData.email}: ${error.message}`);
    }
  }

  // ── Products ─────────────────────────────────────────────────────────────
  let productsCreated = 0;

  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`  [skip] products collection already has ${count} document(s) — skipping seed`);
    } else {
      const inserted = await Product.insertMany(PRODUCTS);
      productsCreated = inserted.length;
      inserted.forEach((p) =>
        console.log(`  [+] created product: ${p.name} (${p.sku}) — qty ${p.quantity}`)
      );
    }
  } catch (error) {
    console.error(`  [error] products: ${error.message}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\nSeed complete — ${usersCreated} user(s) and ${productsCreated} product(s) created.`);
  process.exit(0);
};

seed();
