db.dip.ensureIndex( { store_tank_id: 1 } )
db.dip.ensureIndex( { store_id: 1, date: 1 } )
db.dip.ensureIndex( { date: -1 } )
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.dip"
  },
  {
    "v" : 1,
    "key" : {
      "store_tank_id" : true
    },
    "name" : "store_tank_id_true",
    "ns" : "GalesDips.dip"
  },
  {
    "v" : 1,
    "key" : {
      "store_id" : true,
      "date" : true
    },
    "name" : "store_id_true_date_true",
    "ns" : "GalesDips.dip"
  }
]
Indexes for dip_overshort:
db.dip_overshort.ensureIndex( { timestamp: 1} )
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.dip_overshort"
  },
  {
    "v" : 1,
    "key" : {
      "timestamp" : 1
    },
    "name" : "timestamp_1",
    "ns" : "GalesDips.dip_overshort"
  }
]
Indexes for file:
db.file.getIndexes()

[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.file"
  },
  {
    "v" : 1,
    "key" : {
      "locale" : 1,
      "page_id" : 1,
      "field_name" : 1
    },
    "name" : "locale_1_page_id_1_field_name_1",
    "ns" : "GalesDips.file",
    "sparse" : true
  },
  {
    "v" : 1,
    "key" : {
      "type" : 1
    },
    "name" : "type_1",
    "ns" : "GalesDips.file"
  }
]
Indexes for fuel_deliver:
db.fuel_deliver.getIndexes()
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuel_deliver"
  }
]
Indexes for fuel_price:
db.fuel_price.getIndexes()
db.fuel_price.ensureIndex( { store_id: 1 } )
db.fuel_price.ensureIndex( { date: 1 } )
db.fuel_price.ensureIndex( { date: 1, store_id: 1 }, { unique: true } )

[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuel_price"
  },
  {
    "v" : 1,
    "key" : {
      "store_id" : true
    },
    "name" : "store_id_true",
    "ns" : "GalesDips.fuel_price"
  },
  {
    "v" : 1,
    "key" : {
      "date" : true
    },
    "name" : "date_true",
    "ns" : "GalesDips.fuel_price"
  },
  {
    "v" : 1,
    "unique" : true,
    "key" : {
      "date" : true,
      "store_id" : true
    },
    "name" : "date_true_store_id_true",
    "ns" : "GalesDips.fuel_price"
  }
]
Indexes for fuel_tank:
db.fuel_tank.ensureIndex( { tank_id: 1 } )
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuel_tank"
  },
  {
    "v" : 1,
    "key" : {
      "tank_id" : true
    },
    "name" : "tank_id_true",
    "ns" : "GalesDips.fuel_tank"
  },
  {
    "v" : 1,
    "key" : {
      "tank_id" : 1
    },
    "name" : "tank_id_1",
    "ns" : "GalesDips.fuel_tank"
  }
]
Indexes for fuelsale:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuelsale"
  }
]
Indexes for fuelsale_import:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuelsale_import"
  }
]
Indexes for fuelsale_import_log:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuelsale_import_log"
  }
]
Indexes for fuelsale_import_old:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuelsale_import_old"
  }
]
Indexes for fuelsale_import_store_node:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.fuelsale_import_store_node"
  }
]
Indexes for log:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.log"
  }
]
Indexes for oauth_access_tokens:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.oauth_access_tokens"
  },
  {
    "v" : 1,
    "key" : {
      "access_token" : 1
    },
    "name" : "access_token_1",
    "ns" : "GalesDips.oauth_access_tokens"
  },
  {
    "v" : 1,
    "key" : {
      "user_id" : 1
    },
    "name" : "user_id_1",
    "ns" : "GalesDips.oauth_access_tokens"
  }
]
Indexes for oauth_clients:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.oauth_clients"
  },
  {
    "v" : 1,
    "key" : {
      "client_id" : 1
    },
    "name" : "client_id_1",
    "ns" : "GalesDips.oauth_clients"
  }
]
Indexes for oauth_refresh_tokens:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.oauth_refresh_tokens"
  },
  {
    "v" : 1,
    "key" : {
      "user_id" : 1
    },
    "name" : "user_id_1",
    "ns" : "GalesDips.oauth_refresh_tokens"
  },
  {
    "v" : 1,
    "key" : {
      "client_id" : 1
    },
    "name" : "client_id_1",
    "ns" : "GalesDips.oauth_refresh_tokens"
  },
  {
    "v" : 1,
    "key" : {
      "refresh_token" : 1
    },
    "name" : "refresh_token_1",
    "ns" : "GalesDips.oauth_refresh_tokens"
  }
]
Indexes for propane:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.propane"
  }
]
Indexes for propane_deliver:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.propane_deliver"
  }
]
Indexes for propane_import:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.propane_import"
  }
]
Indexes for propane_import_old:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.propane_import_old"
  }
]
Indexes for store:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.store"
  },
  {
    "v" : 1,
    "unique" : true,
    "key" : {
      "name" : 1
    },
    "name" : "name_1",
    "ns" : "GalesDips.store"
  }
]
Indexes for store_node:
db.store_node.ensureIndex( { store_id: 1 }, { unique : true })
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.store_node"
  },
  {
    "v" : 1,
    "unique" : true,
    "key" : {
      "store_id" : 1
    },
    "name" : "store_id_1",
    "ns" : "GalesDips.store_node"
  },
  {
    "v" : 1,
    "key" : {
      "store_id" : true
    },
    "name" : "store_id_true",
    "ns" : "GalesDips.store_node"
  }
]
Indexes for store_tank:
db.store_tank.ensureIndex( { store_id: 1 } )
db.store_tank.ensureIndex( { tank_id: 1 } )
db.store_tank.ensureIndex( { fuel_type: 1 } )
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.store_tank"
  },
  {
    "v" : 1,
    "key" : {
      "store_id" : 1
    },
    "name" : "store_id_1",
    "ns" : "GalesDips.store_tank"
  },
  {
    "v" : 1,
    "key" : {
      "store_id" : true
    },
    "name" : "store_id_true",
    "ns" : "GalesDips.store_tank"
  },
  {
    "v" : 1,
    "key" : {
      "tank_id" : true
    },
    "name" : "tank_id_true",
    "ns" : "GalesDips.store_tank"
  },
  {
    "v" : 1,
    "key" : {
      "fuel_type" : true
    },
    "name" : "fuel_type_true",
    "ns" : "GalesDips.store_tank"
  }
]
Indexes for user:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.user"
  },
  {
    "v" : 1,
    "key" : {
      "active" : 1
    },
    "name" : "active_1",
    "ns" : "GalesDips.user"
  },
  {
    "v" : 1,
    "key" : {
      "type" : 1
    },
    "name" : "type_1",
    "ns" : "GalesDips.user"
  },
  {
    "v" : 1,
    "unique" : true,
    "key" : {
      "email" : 1
    },
    "name" : "email_1",
    "ns" : "GalesDips.user"
  },
  {
    "v" : 1,
    "key" : {
      "username" : 1
    },
    "name" : "username_1",
    "ns" : "GalesDips.user"
  }
]
Indexes for user_reset:
[
  {
    "v" : 1,
    "key" : {
      "_id" : 1
    },
    "name" : "_id_",
    "ns" : "GalesDips.user_reset"
  }
]
