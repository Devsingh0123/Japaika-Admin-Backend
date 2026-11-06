import { Op } from 'sequelize';
import { User, Order, ChatMessage } from '../models/index.js';
import { sequelize } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const VALID_TOPICS = ['Career', 'Marriage', 'Love', 'Wealth', 'Health', 'General'];

/**
 * GET /api/v1/admin/dashboard/metrics
 * Fast KPI summary cards (Users, Paid Orders, Revenue & Multi-Currency Breakdown).
 */
export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPaidOrders,
    revenueResult,
    revenueByCurrency
  ] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    Order.count({ where: { status: 'paid' } }),
    Order.sum('total_amount', { where: { status: 'paid' } }),
    Order.findAll({
      attributes: [
        'currency',
        [sequelize.fn('ROUND', sequelize.fn('SUM', sequelize.col('total_amount')), 2), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 'paid' },
      group: ['currency'],
      raw: true
    })
  ]);

  res.status(200).json({
    success: true,
    message: 'Dashboard KPI metrics retrieved successfully',
    data: {
      metrics: {
        totalUsers,
        totalPaidOrders,
        totalRevenue: Number(parseFloat(revenueResult || 0).toFixed(2)),
        currency: 'INR',
        revenueByCurrency: revenueByCurrency.map((r) => ({
          currency: r.currency,
          revenue: Number(parseFloat(r.revenue || 0).toFixed(2)),
          count: parseInt(r.count, 10) || 0
        }))
      }
    }
  });
});

/**
 * GET /api/v1/admin/dashboard/revenue-chart
 * Daily revenue & order velocity time-series chart (default 7 days, configurable via ?days=7..90).
 */
export const getRevenueChart = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 7));

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const dailyStats = await Order.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount'],
      [
        sequelize.fn(
          'ROUND',
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0),
          2
        ),
        'revenue'
      ]
    ],
    where: {
      status: 'paid',
      created_at: {
        [Op.gte]: startDate
      }
    },
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    raw: true
  });

  const chartMap = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    chartMap.set(dateKey, {
      date: dateKey,
      label,
      revenue: 0,
      ordersCount: 0
    });
  }

  dailyStats.forEach((row) => {
    const key =
      typeof row.date === 'string'
        ? row.date.split('T')[0]
        : new Date(row.date).toISOString().split('T')[0];

    if (chartMap.has(key)) {
      const entry = chartMap.get(key);
      entry.revenue = Number(parseFloat(row.revenue || 0).toFixed(2));
      entry.ordersCount = parseInt(row.ordersCount, 10) || 0;
    }
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard revenue chart retrieved successfully',
    data: {
      days,
      chartData: Array.from(chartMap.values())
    }
  });
});

/**
 * GET /api/v1/admin/dashboard/topics
 * Aggregates user question counts and percentages by astrology topic from chat_messages.
 */
export const getQuestionTopicStats = asyncHandler(async (req, res) => {
  const rows = await ChatMessage.findAll({
    attributes: [
      [sequelize.fn('COALESCE', sequelize.col('topic'), 'General'), 'topic'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: { role: 'user' },
    group: [sequelize.fn('COALESCE', sequelize.col('topic'), 'General')],
    raw: true
  });

  const countsMap = new Map(VALID_TOPICS.map((t) => [t, 0]));

  rows.forEach((r) => {
    const matchedTopic =
      VALID_TOPICS.find((t) => t.toLowerCase() === String(r.topic || 'General').toLowerCase()) ||
      'General';
    countsMap.set(matchedTopic, (countsMap.get(matchedTopic) || 0) + (parseInt(r.count, 10) || 0));
  });

  const totalQuestions = Array.from(countsMap.values()).reduce((sum, c) => sum + c, 0);

  const topics = VALID_TOPICS.map((topic) => {
    const count = countsMap.get(topic) || 0;
    return {
      topic,
      count,
      percentage: totalQuestions > 0 ? Number(((count / totalQuestions) * 100).toFixed(1)) : 0
    };
  }).sort((a, b) => b.count - a.count);

  res.status(200).json({
    success: true,
    message: 'Question topic analytics retrieved successfully',
    data: {
      totalQuestions,
      topics
    }
  });
});
