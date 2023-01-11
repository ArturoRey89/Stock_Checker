"use strict"
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")

//Setup and connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on("error", (error) => console.log("Database connection error: ", error))
db.on("connected", () => console.log("Connected to database"))

const stockLikesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  ipAddress: [String],
})

const StockLikes = mongoose.model("StockLikes", stockLikesSchema)
const ObjectId = mongoose.Types.ObjectId

module.exports = function (app) {
  app.route("/api/stock-prices").get(function (req, res) {
    let { stock, like } = req.query
    if (typeof stock === "undefined") {
      console.log("no stock provided")
      return
    }
    //addLikes(stock[0], req.headers["x-forwarded-for"]),

    if (Array.isArray(stock)) {
      console.log("Compare stocks:")
      Promise.all([
        getStockPrice(stock[0]),
        getLikes(stock[0]),
        getStockPrice(stock[1]),
        getLikes(stock[1]),
      ]).then((results) => {
        console.log(results)
        let [stock1, likes1, stock2, likes2] = results
        stock1["rel_likes"] = likes1 - likes2
        stock2["rel_likes"] = likes2 - likes1
        res.json({
          stockData: [
            { stock: stock1.symbol, price: stock1.price, likes: likes1 },
            { stock: stock2.symbol, price: stock2.price, likes: likes2 },
          ],
        })
      })
    }

    if (!Array.isArray(stock)) {
      console.log("View stock:")
      Promise.all([getStockPrice(stock), getLikes(stock)]).then((results) => {
        let [stock, likes] = results
        console.log(stock, likes)
        res.json({
          stockData: { stock: stock.symbol, price: stock.price, likes: likes },
        })
      })
    }
  })
}

const getStockPrice = (stockSymbol) => {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`

    xhr.open("GET", url)
    xhr.responseType = "json"
    xhr.onload = () => {
      let { symbol, latestPrice } = JSON.parse(xhr.responseText)
      resolve({ symbol: symbol, price: latestPrice })
    }
    xhr.onerror = () => {
      reject("Stock value not returned")
    }
    xhr.send()
  })
  return promise
}

const bcryptIP = (ipAddress) => {
  const promise = new Promise((resolve, reject) => {
    bcrypt.hash(ipAddress, process.env.SALT * 1, (err, hash) => {
      if (err) {
        reject(err)
      }
      if (hash) {
        resolve(hash)
      }
    })
  })
  return promise
}

const getLikes = (stockName) => {
  const promise = new Promise((resolve, reject) => {
    StockLikes.find({ name: stockName }, (err, query) => {
      if (err) {
        reject(err)
        console.log(err)
      }
      if (query.length == 0) {
        resolve(0)
      }
      if (query.length < 0) {
        resolve(query[0].count)
      }
    })
  })
  return promise
}

const addLikes = (stockName, ipAddress) => {
  const promise = new Promise((resolve, reject) => {
    StockLikes.find({ name: stockName }, (err, query) => {
      if (err) {
        reject(err)
        console.log(err)
      }
      //handle unregisterd stock
      if (query.length == 0) {
        bcryptIP(ipAddress).then((err, ipHash) => {
          StockLikes.create(
            {
              name: stockName.toUpperCase(),
              count: 1,
              ipAddress: [ipHash],
            },
            (err, stockLikes) => {
              if (err) {
                reject(err)
              } else {
                resolve(true)
              }
            }
          )
        })
      }
      // check if IP is new, and add like if new
      if (query.length < 0) {
        let ipIsUnique = true
        query[0].ipAddress.forEach((ipHash) => {
          bcrypt.compare(ipHash, ipAddress, (err, match) => {
            if (err) {
              reject(err)
            }
            if (match) {
              ipIsUnique = false
            }
          })
        })
        if (ipIsUnique) {
          bcryptIP(ipAddress).then((err, ipHash) => {
            if (err) {
              reject(err)
            } else {
              query[0].ipAddress.push(ipHash)
              query[0].count += 1
              query[0].save()
              resolve(true)
            }
          })
        }
      }
    })
  })
  return promise
}
