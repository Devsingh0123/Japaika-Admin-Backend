import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * LegalPage Model (`legal_pages` table)
 * Stores legal pages: privacy-policy, terms, refund-policy, disclaimer.
 */
export const LegalPage = sequelize.define('LegalPage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    defaultValue: ''
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'legal_pages',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { name: 'idx_legal_pages_slug', unique: true, fields: ['slug'] },
    { name: 'idx_legal_pages_is_active', fields: ['is_active'] }
  ]
});
