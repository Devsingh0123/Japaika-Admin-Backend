import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Coupon Model (`coupons` table)
 * ------------------------------
 * Stores server-side coupon codes, discount rules, usage limits, and active status.
 */
export const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // Discount type: 'percentage' (e.g., 20%) or 'flat' (e.g., ₹100 or $5 off)
  discount_type: {
    type: DataTypes.ENUM('percentage', 'flat'),
    allowNull: false,
    defaultValue: 'percentage'
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  // Array of product codes this coupon can be applied to (e.g., ["pack_gold_12"])
  applicable_products: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_hidden: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_special_offer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  max_uses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'coupons',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { name: 'idx_coupons_code', unique: true, fields: ['code'] },
    { name: 'idx_coupons_is_active', fields: ['is_active'] },
    { name: 'idx_coupons_is_hidden', fields: ['is_hidden'] },
    { name: 'idx_coupons_is_special_offer', fields: ['is_special_offer'] }
  ]
});
