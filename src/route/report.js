const ReportHandler = require('../handler/report')

const handler = new ReportHandler()

module.exports = [
  {
    method: 'GET',
    path: '/report/monthly-sales',
    handler: handler.monthlySales,
  },
  /* {
    method: 'GET',
    path: '/report/monthly-sales-detail',
    handler: handler.monthlySalesDetail,
  }, */
  {
    method: 'GET',
    path: '/report/monthly-cash',
    handler: handler.monthlyCash,
  },
  {
    method: 'GET',
    path: '/report/monthly-fuel',
    handler: handler.monthlyFuel,
  },
  {
    method: 'GET',
    path: '/report/monthly-non-fuel',
    handler: handler.monthlyNonFuel,
  },
  {
    method: 'GET',
    path: '/report/monthly-station',
    handler: handler.monthlyStation,
  },
  {
    method: 'GET',
    path: '/report/monthly-station-summary',
    handler: handler.monthlyStationSummary,
  },
  {
    method: 'GET',
    path: '/report/shifts',
    handler: handler.shifts,
  },
  {
    method: 'GET',
    path: '/report/shift-history',
    handler: handler.shiftHistory,
  },
  {
    method: 'GET',
    path: '/report/shift/{id}',
    handler: handler.shift,
  },
  {
    method: 'GET',
    path: '/report/attendant',
    handler: handler.attendant,
  },
  {
    method: 'GET',
    path: '/report/product-sales',
    handler: handler.productSales,
  },
  {
    method: 'GET',
    path: '/report/product-sales-adjust',
    handler: handler.productSalesAdjust,
  },
  {
    method: 'GET',
    path: '/report/oil-product-sales',
    handler: handler.oilProductSales,
  },
]
