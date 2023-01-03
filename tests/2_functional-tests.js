const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const testStock1 = "GOOG"
const testStock2 = "AMZN"
chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("Viewing one stock:", function () {
    test("GET request to /api/stock-prices/", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .query({ stock: testStock1 })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, testStock1);
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          assert.isFalse(res.body.likeRegistered);
          done();
        });
    });
    test("GET request to /api/stock-prices/ and liking it", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .query({ stock: testStock1, like: "true" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, testStock1);
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          assert.isTrue(res.body.likeRegistered);
          done();
        });
    });
    test("GET request to /api/stock-prices/ and liking it again", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .query({ stock: testStock1, like: 'true' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, testStock1);
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          assert.isFalse(res.body.likeRegistered);
          done();
        });
    });
  });
  suite("Viewing two stocks", function () {
    test("GET request to /api/stock-prices/", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .query({ stock: [testStock1, testStock2] })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, testStock1);
          assert.isNumber(res.body.stockData[0].price);
          assert.isNumber(res.body.stockData[0].rel_likes);
          assert.equal(res.body.stockData[1].stock, testStock2);
          assert.isNumber(res.body.stockData[1].price);
          assert.isNumber(res.body.stockData[1].rel_likes);
          assert.isFalse(res.body.likeRegistered);
          assert.strictEqual(
            res.body.stockData[0].rel_likes,
            -res.body.stockData[1].rel_likes
          );
          done();
        });
    });
    test("GET request to /api/stock-prices/ and liking them", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices/")
        .query({ stock: [testStock1, testStock2], like: 'true' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, testStock1)
          assert.isNumber(res.body.stockData[0].price);
          assert.isNumber(res.body.stockData[0].rel_likes);
          assert.equal(res.body.stockData[1].stock, testStock2);
          assert.isNumber(res.body.stockData[1].price);
          assert.isNumber(res.body.stockData[1].rel_likes);
          assert.isTrue(res.body.likeRegistered);
          assert.strictEqual(
            res.body.stockData[0].rel_likes,
            -res.body.stockData[1].rel_likes
          );
          done();
        });
    });
  });
});

// GET single reult: { stockData: { stock: "GOOG", price: 786.9, likes: 1 } };
// GET compare two result: { stockData: [ { stock: "MSFT", price: 62.3, rel_likes: -1 }, { stock: "GOOG", price: 786.9, rel_likes: 1 } ] };
