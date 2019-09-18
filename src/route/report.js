const ReportHandler = require('../handler/report')

const handler = new ReportHandler()

module.exports = [
  {
    method: 'GET',
    path: '/report/monthly-sales',
    handler: handler.monthlySales,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/monthly-sales-detail',
    handler: handler.monthlySalesDetail,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/shifts',
    handler: handler.shifts,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/shift-history',
    handler: handler.shiftHistory,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/shift/{id}',
    handler: handler.shift,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/attendant-report',
    handler: handler.attendant,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/product-sales',
    handler: handler.productSales,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/product-sales-adjust',
    handler: handler.productSalesAdjust,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
  {
    method: 'GET',
    path: '/report/oil-product-sales',
    handler: handler.oilProductSales,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su'],
      // },
    },
  },
]
