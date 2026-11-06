import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = await import('../config/db.js');

async function migrate() {
  console.log('--- Starting Migration: Pricing & Coupon Strategy ---');

  // 1. Inspect existing coupons
  const [coupons] = await sequelize.query('SELECT id, code, discount_type, discount_value, applicable_products FROM coupons');
  console.log(`Found ${coupons.length} coupons in database:`, coupons);

  // 2. Convert 'pack_offer' coupons to 'flat'
  // Specific mappings for known pack_offer coupons based on their previous offer values:
  // pack_gold_12: original 2399, offer 799 -> discount 1600
  // pack_silver_7: original 1399, offer 699 -> discount 700
  for (const c of coupons) {
    if (c.discount_type === 'pack_offer') {
      let flatDiscount = 0;
      if (c.code === 'GOLDNOW') {
        flatDiscount = 1600.00;
      } else if (c.code === 'ASKMAX') {
        flatDiscount = 700.00;
      } else {
        flatDiscount = parseFloat(c.discount_value) || 0;
      }

      console.log(`Migrating coupon "${c.code}" from pack_offer to flat (${flatDiscount})...`);
      await sequelize.query(
        'UPDATE coupons SET discount_type = "flat", discount_value = ? WHERE id = ?',
        { replacements: [flatDiscount, c.id] }
      );
    }
  }

  // 3. Alter coupons table column discount_type to strictly ENUM('percentage', 'flat')
  console.log('Altering coupons.discount_type column to ENUM("percentage", "flat")...');
  await sequelize.query(
    "ALTER TABLE coupons MODIFY COLUMN discount_type ENUM('percentage', 'flat') NOT NULL DEFAULT 'percentage'"
  );
  console.log('Coupons discount_type column updated successfully.');

  // 4. Alter question_packs table: Add default_coupon_id if not present
  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'question_packs' 
      AND COLUMN_NAME = 'default_coupon_id'
  `);

  if (cols.length === 0) {
    console.log('Adding default_coupon_id column to question_packs table...');
    await sequelize.query(`
      ALTER TABLE question_packs 
      ADD COLUMN default_coupon_id CHAR(36) NULL AFTER prices
    `);

    try {
      await sequelize.query(`
        ALTER TABLE question_packs 
        ADD CONSTRAINT fk_question_packs_default_coupon 
        FOREIGN KEY (default_coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
      `);
      console.log('Added foreign key fk_question_packs_default_coupon.');
    } catch (fkErr) {
      console.warn('Foreign key constraint could not be added or already exists:', fkErr.message);
    }

    try {
      await sequelize.query(`
        CREATE INDEX idx_question_packs_default_coupon ON question_packs(default_coupon_id)
      `);
      console.log('Created index idx_question_packs_default_coupon.');
    } catch (idxErr) {
      console.warn('Index could not be created or already exists:', idxErr.message);
    }
  } else {
    console.log('default_coupon_id column already exists in question_packs table.');
  }

  // 5. Migrate question_packs.prices JSON to { basePrice } and link default_coupon_id
  const [packs] = await sequelize.query('SELECT id, code, name, prices, default_coupon_id FROM question_packs');
  console.log(`Found ${packs.length} question packs:`);

  // Re-fetch updated coupons to get their IDs
  const [updatedCoupons] = await sequelize.query('SELECT id, code, discount_type, discount_value FROM coupons');
  const couponMap = new Map(updatedCoupons.map(c => [c.code, c]));

  for (const pack of packs) {
    let pricesObj = typeof pack.prices === 'string' ? JSON.parse(pack.prices) : pack.prices;
    if (!pricesObj || typeof pricesObj !== 'object') {
      pricesObj = {};
    }

    const newPrices = {};
    for (const [curr, p] of Object.entries(pricesObj)) {
      if (typeof p === 'object' && p !== null) {
        // Prioritize originalPrice (e.g. 2399, 1399, 3999), fallback to basePrice or offerPrice
        const base = p.originalPrice !== undefined ? p.originalPrice : (p.basePrice !== undefined ? p.basePrice : p.offerPrice);
        newPrices[curr] = { basePrice: Number(base) };
      } else if (typeof p === 'number') {
        newPrices[curr] = { basePrice: p };
      }
    }

    // Determine default coupon
    let defaultCouponId = pack.default_coupon_id;
    if (!defaultCouponId) {
      if (pack.code === 'pack_gold_12' && couponMap.has('GOLDNOW')) {
        defaultCouponId = couponMap.get('GOLDNOW').id;
      } else if (pack.code === 'pack_silver_7' && couponMap.has('ASKMAX')) {
        defaultCouponId = couponMap.get('ASKMAX').id;
      }
    }

    console.log(`Updating pack "${pack.code}":`, {
      oldPrices: pricesObj,
      newPrices,
      defaultCouponId
    });

    await sequelize.query(
      'UPDATE question_packs SET prices = ?, default_coupon_id = ? WHERE id = ?',
      {
        replacements: [JSON.stringify(newPrices), defaultCouponId, pack.id]
      }
    );
  }

  console.log('--- Migration Finished Successfully ---');

  // Verify final state
  const [finalCoupons] = await sequelize.query('SELECT id, code, discount_type, discount_value, is_active FROM coupons');
  const [finalPacks] = await sequelize.query('SELECT id, code, name, prices, default_coupon_id FROM question_packs');
  console.log('Final Coupons in DB:', JSON.stringify(finalCoupons, null, 2));
  console.log('Final Question Packs in DB:', JSON.stringify(finalPacks, null, 2));

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
