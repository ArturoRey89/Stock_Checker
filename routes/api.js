'use strict';
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

//Setup and connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (error) => console.log("Database connection error: ", error));
db.on("connected", () => console.log("Connected to database"));

const stockLikesSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  count: { 
    type: Number, 
    default: 0 
  },
  ipAddress: [String],
}); 

const StockLikes = mongoose.model("StockLikes", stockLikesSchema);
const ObjectId = mongoose.Types.ObjectId;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let {stock, like} = req.query;
      if(typeof stock === 'undefined') {
        return 
      }

      if( Array.isArray(stock) ) {
        getStockPrice(stock[0]);
        getStockPrice(stock[1]);
        StockLikes.find({ name: stock[0] }, (err,query) => {
          console.log(query)
        });
        StockLikes.find({ name: stock[1] }, (err, query) => {
          console.log(query);
        });
      }

      if (!Array.isArray(stock)) {
        getStockPrice(stock);
        StockLikes.find({ name: stock[0] }, (err, query) => {
          console.log(query);
        });
      }
    });

};

const getStockPrice = (stockSymbol) => {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`;

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.onload = () => {
      let { symbol, latestPrice } = JSON.parse(xhr.responseText);
      resolve({ symbol: symbol, price: latestPrice });
    };
    xhr.onerror = () => {
      reject("Stock value not returned");
    };
    xhr.send();
  });
  return promise;
};

const bcryptIP = (ipAddress) => {
  const promise = new Promise((resolve, reject) => {
    bcrypt.hash(
      req.header("x-forwarded-for"),
      process.env.SALT * 1,
      (err, hash) => {
        if(err){
          reject(err)
        }
        if (hash) {
          resolve(hash, req.header("x-forwarded-for"));
        }
      }
    );
    return promise
  })
}