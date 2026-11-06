import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Dosha Model (`doshas` table)
 * -----------------------------
 * Stores classical Vedic astrological Doshas (e.g. Mangal, Kala Sarpa, Pitru, Guru Chandal, Ganda Moola)
 * including their formation, impact, classical cancellations (Nivaran rules), and structured remedies.
 */
export const Dosha = sequelize.define('Dosha', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sanskrit_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('marriage', 'planetary', 'karmic', 'nakshatra', 'general'),
    allowNull: false,
    defaultValue: 'general'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'severe'),
    allowNull: false,
    defaultValue: 'medium'
  },
  affected_planets: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('affected_planets');
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return raw || [];
    },
    set(val) {
      if (typeof val === 'string') {
        try {
          this.setDataValue('affected_planets', JSON.parse(val));
        } catch {
          this.setDataValue('affected_planets', val ? [val] : []);
        }
      } else {
        this.setDataValue('affected_planets', Array.isArray(val) ? val : []);
      }
    }
  },
  affected_houses: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('affected_houses');
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return raw || [];
    },
    set(val) {
      if (typeof val === 'string') {
        try {
          this.setDataValue('affected_houses', JSON.parse(val));
        } catch {
          this.setDataValue('affected_houses', val ? [val] : []);
        }
      } else {
        this.setDataValue('affected_houses', Array.isArray(val) ? val : []);
      }
    }
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  effects: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  cancellations: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  remedies: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('remedies');
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return raw || [];
    },
    set(val) {
      if (typeof val === 'string') {
        try {
          this.setDataValue('remedies', JSON.parse(val));
        } catch {
          this.setDataValue('remedies', []);
        }
      } else {
        this.setDataValue('remedies', Array.isArray(val) ? val : []);
      }
    }
  },
  featured_image: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'published'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  views_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  canonical_url: {
    type: DataTypes.STRING(512),
    allowNull: true
  }
}, {
  tableName: 'doshas',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { name: 'idx_doshas_slug', unique: true, fields: ['slug'] },
    { name: 'idx_doshas_category', fields: ['category'] },
    { name: 'idx_doshas_status_active', fields: ['status', 'is_active'] },
    { name: 'idx_doshas_sort_order', fields: ['sort_order'] }
  ]
});
