import { User } from './User.js';
import { Admin } from './Admin.js';
import { Order } from './Order.js';
import { Invoice } from './Invoice.js';
import { Coupon } from './Coupon.js';
import { ChatThread } from './ChatThread.js';
import { ChatMessage } from './ChatMessage.js';
import { BirthDetail } from './BirthDetail.js';
import { QuestionPack } from './QuestionPack.js';
import { ReportPack } from './ReportPack.js';
import { Blog } from './Blog.js';
import { Faq } from './Faq.js';
import { LegalPage } from './LegalPage.js';
import { Dosha } from './Dosha.js';

// User <-> Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Invoice
User.hasMany(Invoice, { foreignKey: 'user_id', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order <-> Invoice
Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User <-> ChatThread
User.hasMany(ChatThread, { foreignKey: 'user_id', as: 'chat_threads' });
ChatThread.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> BirthDetail
User.hasMany(BirthDetail, { foreignKey: 'user_id', as: 'birth_details' });
BirthDetail.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ChatThread <-> ChatMessage
ChatThread.hasMany(ChatMessage, { foreignKey: 'thread_id', as: 'messages' });
ChatMessage.belongsTo(ChatThread, { foreignKey: 'thread_id', as: 'thread' });

// Admin <-> Blog
Admin.hasMany(Blog, { foreignKey: 'author_id', as: 'blogs' });
Blog.belongsTo(Admin, { foreignKey: 'author_id', as: 'author' });

// QuestionPack <-> Coupon (Auto-apply / default offer coupon)
QuestionPack.belongsTo(Coupon, { foreignKey: 'default_coupon_id', as: 'default_coupon' });
Coupon.hasMany(QuestionPack, { foreignKey: 'default_coupon_id', as: 'question_packs' });

export {
  User,
  Admin,
  Order,
  Invoice,
  Coupon,
  ChatThread,
  ChatMessage,
  BirthDetail,
  QuestionPack,
  ReportPack,
  Blog,
  Faq,
  LegalPage,
  Dosha
};
