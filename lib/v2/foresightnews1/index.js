const cheerio = require('cheerio');
const config = require('@/config').value;
const { parseDate } = require('@/utils/parse-date');

const categories = {
    '': {
        id: 'feed',
        title: '首页',
    },
    article: {
        id: 'feed',
        title: '文章',
    },
    news: {
        id: 'news',
        title: '快讯',
    },
    column: {
        id: 'articles',
        title: '专栏',
        route: 'column/detail/'
    },
};

module.exports = async (ctx) => {
    const category = ctx.params.category ?? '';
    const id = ctx.params.id ?? '1';

    const rootUrl = 'https://foresightnews.pro';

    const currentUrl = `${rootUrl}/${categories[category].route}${id}`;
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

            return $('.article-content-left')
                .toArray()
                .map((item) => {
                    item = $(item);

                    const tags = item
                        .find('.tag')
                        .toArray()
                        .map((t) => $(t).text().trim());

                    const a = item.find('a');
                    return {
                        title: item.find('.article-body-title').text(),
                        author: item.find('.article-author').text() ?? undefined,
                        category: tags,
                        description: item.find('.article-body-title').text() ?? '',
                        pubDate: parseDate(item.find('.article-time').text()),
                        link: `${rootUrl}${a.attr('href')}`,
                    };
                });
        },
        config.cache.routeExpire,
        false
    );

    items = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {

                // 超过30天的 不访问原站了
                const now = new Date().getTime();
                if (now - item.pubDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
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

                item.description = $('.detail-body').html();
                item.category = $('.blog-tags')
                    .toArray()
                    .map((item) => $(item).text().trim());

                return item;
            })
        )
    );

    ctx.state.data = {
        title: `${categories[category].title} - Foresight News`,
        link: currentUrl,
        item: items,
    };
};
