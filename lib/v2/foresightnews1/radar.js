module.exports = {
    'foresightnews1.pro': {
        _name: 'Foresight News',
        '.': [
            {
                title: '首页',
                docs: 'https://docs.rsshub.app/new-media.html#foresight-news-shou-ye',
                source: ['/article', '/'],
                target: '/foresightnews1',
            },
            {
                title: '文章',
                docs: 'https://docs.rsshub.app/new-media.html#foresight-news-wen-zhang',
                source: ['/article', '/'],
                target: '/foresightnews1/article',
            },
            {
                title: '快讯',
                docs: 'https://docs.rsshub.app/new-media.html#foresight-news-kuai-xun',
                source: ['/news', '/'],
                target: '/foresightnews1/news',
            },
            {
                title: '专栏',
                docs: 'https://docs.rsshub.app/new-media.html#foresight-news-zhuan-lan',
                source: ['/column/detail/:id', '/'],
                target: '/foresightnews1/column/:id',
            },
        ],
    },
};
