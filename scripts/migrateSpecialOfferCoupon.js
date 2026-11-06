import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = await import('../config/db.js');

async function migrate() {
  console.log('--- Starting Migration: Add is_special_offer to coupons ---');

  // 1. Check if is_special_offer column exists
  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'coupons' 
      AND COLUMN_NAME = 'is_special_offer'
  `);

  if (cols.length === 0) {
    console.log('Adding is_special_offer column to coupons table...');
    await sequelize.query(`
      ALTER TABLE coupons 
      ADD COLUMN is_special_offer BOOLEAN NOT NULL DEFAULT FALSE AFTER is_hidden
    `);
    console.log('Column is_special_offer added successfully.');

    try {
      await sequelize.query(`
        CREATE INDEX idx_coupons_is_special_offer ON coupons(is_special_offer)
      `);
      console.log('Created index idx_coupons_is_special_offer.');
    } catch (idxErr) {
      console.warn('Index could not be created or already exists:', idxErr.message);
    }
  } else {
    console.log('is_special_offer column already exists in coupons table.');
  }

  // 2. Mark QUICKGOLD as active special offer if it exists
  const [quickgold] = await sequelize.query(`
    SELECT id, code, is_special_offer FROM coupons WHERE code = 'QUICKGOLD'
  `);

  if (quickgold.length > 0) {
    console.log('Marking QUICKGOLD as active special offer...');
    await sequelize.query(`
      UPDATE coupons SET is_special_offer = TRUE WHERE code = 'QUICKGOLD'
    `);
    console.log('QUICKGOLD marked as is_special_offer = true.');
  }

  // 3. Inspect final state
  const [coupons] = await sequelize.query(`
    SELECT id, code, discount_type, discount_value, is_active, is_hidden, is_special_offer 
    FROM coupons
  `);
  console.log('Coupons in DB after migration:', JSON.stringify(coupons, null, 2));

  console.log('--- Migration Finished Successfully ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
