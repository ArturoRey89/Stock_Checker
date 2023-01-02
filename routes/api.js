'use strict';
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

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      
    });
    
};
