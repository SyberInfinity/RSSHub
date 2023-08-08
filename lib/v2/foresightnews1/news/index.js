const cheerio = require('cheerio');
const config = require('@/config').value;
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {

    const rootUrl = `https://foresightnews.pro`
    const currentUrl = `https://foresightnews.pro/news`;
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
            await page.waitForSelector('.list_body');

            const html = await page.evaluate(() => document.documentElement.innerHTML);
            await page.close();
            const $ = cheerio.load(html);

            return $('.el-timeline-item')
                .toArray()
                .map((item) => {
                    item = $(item);

                    const a = item.find('a.news_body_title');
                    return {
                        title: item.find('a.news_body_title').text(),
                        author: undefined,
                        description: item.find('.news_body_content').text() ?? '',
                        pubDate: parseDate(item.find('.el-timeline-item__timestamp').text()),
                        link: `${rootUrl}${a.attr('href')}`,
                    };
                });
        },
        config.cache.routeExpire,
        false
    );

    const maxCount = 10
    let execCount = 0
    items = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                execCount++ 
                if (execCount > maxCount) {
                    item.pubDate = "2020-01-01 00:00:00"
                    return item;
                } 
                const page = await browser.newPage();
                await page.setRequestInterception(true);
                page.on('request', (request) => {
                    request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
                });
                await page.goto(item.link, {
                    waitUntil: 'domcontentloaded',
                });
    
                const html = await page.evaluate(() => document.documentElement.innerHTML);
                await page.close();
                const $ = cheerio.load(html);
    
                item.pubDate = $('.topic-time').text()
                return item;
            })
        )
    );

    ctx.state.data = {
        title: `快讯 - Foresight News`,
        link: currentUrl,
        item: items,
    };
};
