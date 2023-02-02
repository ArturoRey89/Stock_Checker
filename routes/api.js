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
    //no query provided
    if (typeof stock === "undefined") {
      console.log("no stock provided")
      return
    }

    //Compare Stocks
    if (Array.isArray(stock)) {
      if (like === "true") {
        let ip = req.headers["x-forwarded-for"]
        addLikes(stock[0], ip)
          .then((likeAdded) => console.log("like added: ", likeAdded))
          .catch((error) => console.log("addLikes error: ", error))
        addLikes(stock[1], ip)
          .then((likeAdded) => console.log("like added: ", likeAdded))
          .catch((error) => console.log("addLikes error: ", error))
      }
      Promise.all([
        getStockPrice(stock[0]),
        getLikes(stock[0]),
        getStockPrice(stock[1]),
        getLikes(stock[1]),
      ])
        .then((results) => {
          let [stock1, likes1, stock2, likes2] = results
          res.json({
            stockData: [
              {
                stock: stock1.symbol,
                price: stock1.price,
                rel_likes: likes1 - likes2,
              },
              {
                stock: stock2.symbol,
                price: stock2.price,
                rel_likes: likes2 - likes1,
              },
            ],
          })
        })
        .catch((error) => console.log("Promise.all error: ", error))
    }
    //Get single stock
    if (!Array.isArray(stock)) {
      if (like === "true") {
        addLikes(stock, req.headers["x-forwarded-for"])
          .then((likeAdded) => console.log("like added: ", likeAdded))
          .catch((error) => console.log("addLikes error: ", error))
      }
      Promise.all([getStockPrice(stock), getLikes(stock)])
        .then((results) => {
          let [stock, likes] = results
          res.json({
            stockData: {
              stock: stock.symbol,
              price: stock.price,
              likes: likes,
            },
          })
        })
        .catch((error) => console.log("Promise.all error: ", error))
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
        console.log("bcrypt.hash() error: ", err)
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
    StockLikes.find({ name: stockName.toUpperCase() }, (err, query) => {
      if (err) {
        reject(err)
        console.log(err)
      }
      if (query.length == 0) {
        resolve(0)
      }
      if (query.length > 0) {
        resolve(query[0].count)
      }
    })
  })
  return promise
}

const addLikes = (stockName, ipAddress) => {
  const promise = new Promise((resolve, reject) => {
    StockLikes.find({ name: stockName.toUpperCase() }, (err, query) => {
      if (err) {
        reject(err)
        console.log(err)
      }
      //handle unregisterd stock
      if (typeof query[0] == "undefined") {
        bcryptIP(ipAddress).then((ipHash) => {
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
                resolve([true, "New stock added: ", stockLikes])
              }
            }
          )
        })
      }
      // check if IP is new, and add like if new
      else {
        let ipIsUnique = true
        let compareIpAddressArray = []
        query[0].ipAddress.forEach((ipHash) => {
          compareIpAddressArray.push(
            bcrypt.compare(ipAddress, ipHash, (err, match) => {
              if (err) {
                console.log("bcrypt.compare Error: ", err)
                reject(err)
              }
              if (match) {
                ipIsUnique = false
                resolve([false, "IP already registered"])
              }
            })
          )
        })
        Promise.all(compareIpAddressArray)
          .then(() => {
            if (ipIsUnique) {
              bcryptIP(ipAddress)
                .then((ipHash) => {
                  query[0].ipAddress.push(ipHash)
                  query[0].count += 1
                  query[0].save()
                  resolve([true, "New like added, ip:", ipAddress])
                })
                .catch((err) => {
                  console.log("bcryptIP Error: ", err)
                  reject(err)
                })
            }
          })
          .catch((err) => {
            console.log("Promise.all error", err)
            reject(err)
          })
      }
    })
  })
  return promise
}
