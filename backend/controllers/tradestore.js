const { UserStore } = require('../models/userStore');

const searchTradeItems = async (req,res) => {
  try {
    const { cat, m, cond, k } = req.query;
    const userStores = await UserStore.find({}).populate('itemsForTrade');
    //obtain all tradeitems from userStores
    const allTradeItemArrays = userStores.map(store => store.itemsForTrade);
    let allTradeItems = [];
    allTradeItemArrays.forEach(item => {
      item.forEach(tradeItem => {
        allTradeItems.push(tradeItem);
      })
    })
    
    //if category, filter by category
    if(cat) {
      allTradeItems = allTradeItems.filter(item => cat === item.itemCategory);
    }

    //if marketValue, filter by approximate market value
    /*
      marketValue categories:
      0: 0-20 dollars
      20: >20-100 dollars
      100: >100-500 dollars
      500: >500-1000 dollars
      1000: >1000 collars
    */
    if(m) {
      allTradeItems = allTradeItems.filter(item => {
        switch(Number(m)) {
          case 0:
            if(item.approximateMarketVal >= 0 && item.approximateMarketVal <= 20) 
              return true;
          case 20:
            if(item.approximateMarketVal > 20 && item.approximateMarketVal < 100)
              return true;
          case 100: 
            if(item.approximateMarketVal > 100 && item.approximateMarketVal < 500) 
              return true;
          case 500:
            if(item.approximateMarketVal > 500 && item.approximateMarketVal < 1000)
              return true;
          case 1000:
            if(item.approximateMarketVal > 1000)
              return true;
          default:
            return false;
        }
      })
    }
    //if keyword, search for the lowercase version of keyword in name, brand, and description (exact match)
    if(k) {
      let key = k.toLowerCase();
      allTradeItems = allTradeItems.filter(item => {
        let { name, brand, description } = item;
        name = name.toLowerCase();
        brand = brand.toLowerCase();
        description = description.toLowerCase();
        if (name.includes(key) || brand.includes(key) || description.includes(key)) {
          return true;
        }
        return false;
      })
    }
    //if condition, filter by condition
    /*
      options are Poor, Used, Good, Like New
    */
    if(cond) {
      allTradeItems = allTradeItems.filter(item => {
        return item.condition === cond;
      })
    }
    allTradeItems.sort((a,b) => a.name - b.name);
    res.status(200).send({searchResults: allTradeItems});

  } catch (e) {
    return res.status(500).send({success: false, message: 'Error searching trade items'});
  }
};

module.exports = {
  searchTradeItems
}