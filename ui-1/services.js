const _ = require('underscore');
const moment = require('moment');
const SettleSDK = require('settlesdk');

module.exports = {
  GetRisk: (data, Update) => {
    return new Promise(async (resolve, reject) => {
      try {
        var guid = await SettleSDK.exchangeTokenForGuid(data.token)

        //pull the users settle position from our holdings endpoint.  This will include all balances of all tokens
        //aggregated across all exchanges that have been imported by the user
        let balances = await SettleSDK.Portfolio.Holdings({ guid })

        //ignore fiat and untracked tokens since we need good market data for this example
        let tokens = _.reject(balances.tracked, (token) => {
          return isNaN(token.id) || token.id == 0 || _.isUndefined(token.id) })
        Update({tokens}) //update the gui with our partial progress

        if(!tokens.length) {
          // no usable holdings
          resolve({hasHoldings: false})
        }

        let ids = _.pluck(tokens, 'id')
        let ptfl_value = 0;
        let pxMap = {};
        let timestamp = moment().startOf('day').subtract(365,'days').unix();
        let today = moment().startOf('day').unix();

        //loop over all our tokens
        await Promise.all(_.map(ids, async id => {
          return new Promise( async (resolve, reject) => {
            try {
              let bal = _.find(tokens, b => { return b.id == id;});
              if (_.isUndefined(id) || _.isNull(id) || _.isUndefined(bal.value_usd) || _.isNull(bal.value_usd)) {
                resolve();
                return;
              }

              //grab the previous year's daily prices for this token from the settle api
              let rsp = await SettleSDK.PriceFeed.PriceHistory({
                id,
                resolution: 'days',
                timestamp
              })

              pxMap[id] = {token_id: id};
              let prices = _.take(rsp.reverse(), 365);

              //sanitize the price history returned (if a coin came into or out of existence fill price history with 0's so the data aligns nicely)
              while (prices[0][0] > timestamp) {
                let day = moment.unix(prices[0][0]).subtract(1, 'days').unix();
                prices.unshift([day, 0]);
              }

              while (prices[prices.length-1][0] < today) {
                let day = moment.unix(prices[prices.length-1][0]).add(1, 'days').unix();
                prices.push([day, 0]);
              }

              //we need each tokens usd value and a portfolio total for computing the weights of each token
              pxMap[id].value_usd = bal.value_usd;
              ptfl_value += bal.value_usd;

              let returns = [];
              //let sum = 0;
              //compute the daily % return time series data
              for (let i = 1; i < prices.length; i++) {
                let ret = prices[i-1][1]==0 ? 0 : (prices[i][1] - prices[i-1][1]) / prices[i-1][1];

                //check for price annomolies (too big up or down moves need to be confirmed over multiple days)
                if (ret > 1 || ret < -0.75) { //huge move
                  if (i >= prices.length-1) {
                    returns.push(0);
                    continue;
                  }
                  let ret2 = (prices[i+1][1] - prices[i-1][1])/ prices[i-1][1];
                  if (ret2 < 1 && ret2 > -0.75) {//huge move not confirmed so correct it
                    prices[i][1] = (prices[i-1][1] + prices[i+1][1]) / 2.0;
                    ret = (prices[i][1] - prices[i-1][1]) / prices[i-1][1];
                  }
                  //else the huge move is real so let it be
                }

                returns.push( _.isNaN(ret) ? 0 : ret );
                //sum += ret;
              }

              //diff out the trendline (compute average returns and subtract for each sample)
              //pxMap[id].avgReturn = sum / (prices.length - 1);
              //pxMap[id].returns = _.map(returns, x => { return x-pxMap[id].avgReturn;});
              pxMap[id].returns = returns;

              resolve();
            } catch (error) {
              reject(error);
            }
          })
        }));


        let ptfl_returns = new Array(364).fill(0);
        //compute the portfolio returns time series as a weighted average of each tokens returns
        _.map(pxMap, coin => {
          let weight = coin.value_usd / ptfl_value;
          for(let i = 0; i < coin.returns.length; i++) {
            if (!_.isNaN(coin.returns[i]) && !_.isNaN(weight))
              ptfl_returns[i] += coin.returns[i] * weight;
          }
        });

        ptfl_returns = _.reject(ptfl_returns, (ret) => { return isNaN(ret) });
        let sum = _.reduce(ptfl_returns, (memo, num) => { return memo + num;}, 0);
        let avgRet = sum / 364.0;
        ptfl_returns = _.map(ptfl_returns, x => { return x-avgRet;});

        let min = Number.MAX_SAFE_INTEGER;
        let max = Number.MIN_SAFE_INTEGER;
        //calculate the best/worst and average portfolio returns for the histogram
        _.each(ptfl_returns, ret => {
          if (_.isNaN(ret)) return;
          if (ret < min) min = ret;
          if (ret > max) max = ret;
        })

        sorted = _.sortBy(ptfl_returns, x => {return x});

        let len = 10.0;
        let step = Number((max - min) / len).toFixed(2);
        let buckets = new Array(len);
        let sumSqDiff = 0;
        let firstMid = min + (step / 2.0);
        //compute the histogram data (partition returns space into 10 buckets and count sample)
        for(let i = 0; i < len; i++)
          buckets[i] = [(firstMid + i * step) * 100.0, 0];

        //compute the standard deviation of the portfolio returns data
        _.each(ptfl_returns, ret => {
          sumSqDiff += (ret - avgRet) * (ret - avgRet);
          for(let i = 1; i < len; i++) {
            if (ret < (min + i * step)){
              buckets[i-1][1] ++;
              return;
            }
          }
          buckets[len - 1][1] ++;
        })

        let stDev = Math.sqrt( sumSqDiff / 363.0 );
        let anualStDev = stDev * Math.sqrt(363);
        let var1pct = sorted[ Math.round(364 / 100) ];
        let var5pct = sorted[ Math.round(364 / 100 * 5) ];

        //package up results for the gui
        let tableData = {};
        tableData.worst    = [min * 100.0, min * ptfl_value];
        tableData.best     = [max * 100.0, max * ptfl_value];
        tableData.avg      = [0.0, 0.0];

        tableData.var1pct  = [var1pct * 100.0, var1pct * ptfl_value];
        tableData.var5pct  = [var5pct * 100.0, var5pct * ptfl_value];

        tableData.dayStDev = [stDev * 100.0, stDev * ptfl_value];
        tableData.yrStDev  = [anualStDev * 100.0, anualStDev * ptfl_value];

        resolve({ table_data: tableData, histogram_data: buckets });
      } catch(error) {
        reject(error)
      }
    })
  }
}
