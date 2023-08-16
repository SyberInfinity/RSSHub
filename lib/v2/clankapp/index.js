const cheerio = require('cheerio');
const config = require('@/config').value;
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const rootUrl = 'https://clankapp.com/';

    const currentUrl = `https://clankapp.com/feed`;
    const browser = await require('@/utils/puppeteer')();


    let items = await ctx.cache.tryGet(
        currentUrl,
        async () => {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
            });
            await page.goto(currentUrl, {
                waitUntil: 'domcontentloaded',
            });

            const nuxtData = await page.evaluate(() => window.__NUXT__);
            const list = nuxtData.data[0].txs
            await page.close();

            console.log(list)
            return list.map((item) => {
                console.log(item)

                let description = {
                    blockchain: item.blockchain,
                    symbol: item.symbol,
                    id: item.id,
                    transaction_type: item.transaction_type, 
                    hash: item.hash,
                    from_address: item.from_address,
                    from_owner: item.from_owner,
                    to_address: item.to_address,
                    to_owner: item.to_owner,
                    timestamp: item.timestamp,
                    amount: item.amount,
                    amount_usd: item.amount_usd,
                };

                description = JSON.stringify(description);


                return {
                    title: `${item.hash}`,
                    description: `${description}`,
                    pubDate: `${item.date}`,
                    link: `${rootUrl}${item.id}`,
                };                
            })
        },
        config.cache.routeExpire,
        false
    );

    ctx.state.data = {
        title: `clankapp - Feed`,
        link: currentUrl,
        item: items,
    };
};
