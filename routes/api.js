'use strict';
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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
  name: { type: String, required: true },
  count: { type: Number, default: 1 },
  ipAddress: [String],
}); 

const StockLikes = mongoose.model("StockLikes", stockLikesSchema);
const ObjectId = mongoose.Types.ObjectId;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let {stock, like} = req.query;

      if(Array.isArray(stock)) {
        getStockPrice(stock[0]).then((response) => console.log(response));
        getStockPrice(stock[1]).then((response) => console.log(response));
      }

      if(!Array.isArray(stock)) {
        getStockPrice(stock).then((response) => console.log(response));
      }
    });

    const getStockPrice = (stockSymbol) => {
      const promise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`;

        xhr.open("GET", url);
        xhr.responseType = 'json'
        xhr.onload = () => {
          let { symbol, latestPrice } = JSON.parse(xhr.responseText);
          resolve({ symbol: symbol, price: latestPrice });
        };
        xhr.onerror = () => {
          reject("Stock value not returned")
        }
        xhr.send();
      })
      console.log(stockSymbol);
      return promise
    }

};
