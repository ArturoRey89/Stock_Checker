const chaiHttp = require("chai-http")
const chai = require("chai")
const assert = chai.assert
const server = require("../server")
const testStock1 = "GOOG"
const testStock2 = "AMZN"
const ipAddress = "192.168.2.1"
chai.use(chaiHttp)

suite("Functional Tests", function () {
  suite("Viewing one stock:", function () {
    test("GET request to /api/stock-prices/", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .set("X-Forwarded-For", ipAddress)
        .query({ stock: testStock1 })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.stockData.stock, testStock1)
          assert.isNumber(res.body.stockData.price)
          assert.isNumber(res.body.stockData.likes)
          done()
        })
    })
    test("GET request to /api/stock-prices/ and liking it", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .set("X-Forwarded-For", ipAddress)
        .query({ stock: testStock1, like: "true" })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.stockData.stock, testStock1)
          assert.isNumber(res.body.stockData.price)
          assert.isNumber(res.body.stockData.likes)
          done()
        })
    })
    test("GET request to /api/stock-prices/ and liking it again", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .set("X-Forwarded-For", ipAddress)
        .query({ stock: testStock1, like: "true" })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.stockData.stock, testStock1)
          assert.isNumber(res.body.stockData.price)
          assert.isNumber(res.body.stockData.likes)
          done()
        })
    })
  })
  suite("Viewing two stocks", function () {
    test("GET request to /api/stock-prices/", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .set("X-Forwarded-For", ipAddress)
        .query({ stock: [testStock1, testStock2] })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.stockData[0].stock, testStock1)
          assert.isNumber(res.body.stockData[0].price)
          assert.isNumber(res.body.stockData[0].rel_likes)
          assert.equal(res.body.stockData[1].stock, testStock2)
          assert.isNumber(res.body.stockData[1].price)
          assert.isNumber(res.body.stockData[1].rel_likes)
          assert.strictEqual(
            res.body.stockData[0].rel_likes,
            -res.body.stockData[1].rel_likes
          )
          done()
        })
    })
    test("GET request to /api/stock-prices/ and liking them", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .set("X-Forwarded-For", ipAddress)
        .query({ stock: [testStock1, testStock2], like: "true" })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.stockData[0].stock, testStock1)
          assert.isNumber(res.body.stockData[0].price)
          assert.isNumber(res.body.stockData[0].rel_likes)
          assert.equal(res.body.stockData[1].stock, testStock2)
          assert.isNumber(res.body.stockData[1].price)
          assert.isNumber(res.body.stockData[1].rel_likes)
          assert.strictEqual(
            res.body.stockData[0].rel_likes,
            -res.body.stockData[1].rel_likes
          )
          done()
        })
    })
  })
})
