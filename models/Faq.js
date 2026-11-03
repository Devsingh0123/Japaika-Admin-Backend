import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Faq Model (`faqs` table)
 */
export const Faq = sequelize.define('Faq', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  question: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'general'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'faqs',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { name: 'idx_faqs_sort_order', fields: ['sort_order'] },
    { name: 'idx_faqs_is_active', fields: ['is_active'] }
  ]
});
