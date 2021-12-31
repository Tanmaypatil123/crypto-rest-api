//-------------- Scraping methods -------------------------- 
//https://www.coingecko.com/en?page=1
const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
async function getPriceFeed(Pageurl) {
  try {
    const keys = [
      "rank",
      "name",
      "price",
      "1h",
      "24h",
      "7d",
      "24h_volume",
      "market_cap",
    ];
    const coinArr = [];
    const { data } = await axios({
      method: "GET",
      url: Pageurl,
    });
    const $ = cheerio.load(data);
    const elemSelctor =
      "body > div.container > div.gecko-table-container > div.coingecko-table > div.position-relative > div > table > tbody > tr";
    $(elemSelctor).each((parentIdx, parentElem) => {
      let keyIdx = 0;
      const coinObj = {};

      $(parentElem)
        .children()
        .each((childIdx, childElem) => {
          let tdValue = $(childElem).text().trim();
          if (tdValue) {
            coinObj[keys[keyIdx]] = tdValue;
            keyIdx++;
          }
        });
      coinArr.push(coinObj);
    });
    return coinArr;
      
  } catch (err) {
    console.log(err);
  }
}


async function getHistoricalData(pageUrl){
  try{
    const keys = [
      "Date",
      "MarketCap",
      "volume",
      "Open",
      "Close"
    ]
    const historyArr = []
    const { data } = await axios({
      method: "GET",
      url: pageUrl,
    });
    const $ = cheerio.load(data);
    const elemSelctor =
      "body > div.container > div.coin-card > div > div.card-body > div > div > table > tbody > tr";

    $(elemSelctor).each((parentIdx, parentElem) => {
      let keyIdx = 0;
      const historyObj = {};
      $(parentElem)
        .children()
        .each((childIdx, childElem) => {
          let tdValue = $(childElem).text().trim();
          if (tdValue) {
            historyObj[keys[keyIdx]] = tdValue;
            keyIdx++;
          }
        });
      historyArr.push(historyObj);
    });
    return historyArr
  }catch(err){
    console.log(err)
  }
}

//-------------------- Server -------------------------

const fastify = require('fastify')({logger:true})

fastify.get('/api/price-feed',async (req,reply)=> {
  const Pageurl = "https://www.coingecko.com/en?page=1";
  const pricefeed = await getPriceFeed(Pageurl);
  reply.send({
    result:pricefeed
  })
})

fastify.route({
  method:'GET',
  url:'/api/historical_data/',
  properties:{
    today:{type:'string'},
    pastDate:{type:'string'},
    data : {type:"array"}
  },
  schema:{
    querystring:{
      name:{type:'string'}
    }
  },
  handler:async (request,reply) => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy +"-"+mm+"-"+dd
    AyearAgo = yyyy-1 + "-"+mm+"-"+dd
    coin = request.query.name
    const url = `https://www.coingecko.com/en/coins/${coin}/historical_data/usd?end_date=${today}&start_date=${AyearAgo}#panel`;
    const getHistory = await getHistoricalData(url)
    reply.send({
      result:request.query,
      today:today,
      pastDate:AyearAgo,
      data:getHistory
    })
  }
})
const start = async() =>{
  try{
    await fastify.listen(3000)
  }catch(err){
    fastify.log.error(err)
    process.exit(1)
  }
}
start()