const fetch = require('node-fetch');

async function fetchWithFallback(url) {
    const proxies = [
        (u) => \`https://api.codetabs.com/v1/proxy?quest=\${encodeURIComponent(u)}\`,
        (u) => \`https://corsproxy.io/?\${encodeURIComponent(u)}\`,
        (u) => \`https://api.allorigins.win/raw?url=\${encodeURIComponent(u)}&disableCache=\${Date.now()}\`
    ];
    for (let proxy of proxies) {
        try {
            console.log("Trying proxy: " + proxy(url));
            const res = await fetch(proxy(url));
            if (res.ok) {
                const data = await res.json();
                return data;
            }
        } catch (e) {
            console.error(e.message);
        }
    }
    return null;
}

const now = Math.floor(Date.now() / 1000);
const fetchStart = Math.floor(new Date('2014-01-01').getTime() / 1000);
const url = \`https://query1.finance.yahoo.com/v8/finance/chart/0050.TW?interval=1d&period1=\${fetchStart}&period2=\${now}&events=div\`;

fetchWithFallback(url).then(data => {
    if (data && data.chart && data.chart.result) {
        console.log(JSON.stringify(data.chart.result[0].events, null, 2));
    } else {
        console.log("No data");
    }
});
