import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

// 裝 Chart.js
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
);

// 假數據（測試線圖用）
const gamesData = [
  {
    name: "Schedule",
    icon: "圖",
    playersNow: 180936,
    trendData: [175000, 178000, 182000, 179000, 180000, 181000, 180936],
  },
  {
    name: "inZOI",
    icon: "圖",
    playersNow: 24256,
    trendData: [23000, 23500, 24000, 24500, 24200, 24300, 24256],
  },
  {
    name: "The First Berserker: Khazan",
    icon: "圖",
    playersNow: 14495,
    trendData: [14000, 14200, 14500, 14600, 14400, 14300, 14495],
  },
  {
    name: "Legend of Heroes: Three Kingdoms",
    icon: "圖",
    playersNow: 7942,
    trendData: [8000, 8100, 7900, 7800, 7950, 7900, 7942],
  },
  {
    name: "Sultan’s Game",
    icon: "圖",
    playersNow: 10823,
    trendData: [10000, 10500, 11000, 10800, 10700, 10900, 10823],
  },
  {
    name: "AI Limit",
    icon: "圖",
    playersNow: 5575,
    trendData: [5000, 5200, 5400, 5500, 5600, 5580, 5575],
  },
  {
    name: "ENA: Dream BBQ",
    icon: "圖",
    playersNow: 2985,
    trendData: [3000, 3100, 2900, 2950, 2980, 2970, 2985],
  },
  {
    name: "Atomfall",
    icon: "圖",
    playersNow: 1585,
    trendData: [1600, 1550, 1500, 1520, 1570, 1590, 1585],
  },
  {
    name: "Cyber Warriors",
    icon: "圖",
    playersNow: 12000,
    trendData: [11000, 11500, 11800, 11900, 12000, 12100, 12000],
  },
  {
    name: "Mystic Realm",
    icon: "圖",
    playersNow: 9500,
    trendData: [9000, 9200, 9300, 9400, 9450, 9500, 9500],
  },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { display: false },
    y: { display: false },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
};

// 定義動態匯率相關邏輯
const DEFAULT_EXCHANGE_RATE = 7.8; // 預設匯率，作為備用
const fetchExchangeRate = async () => {
  try {
    // 使用 HKMA API 獲取每日匯率數據
    const response = await fetch(
      "https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/er-ir/er-eeri-daily?offset=0"
    );
    const data = await response.json();

    // 提取港元兌美元的匯率
    const latestRecord = data.result.records[0]; // 最新一筆記錄
    const usdToHkdRate = parseFloat(latestRecord.usd); // 1 USD = X HKD

    return usdToHkdRate || DEFAULT_EXCHANGE_RATE;
  } catch (error) {
    console.error("Error fetching exchange rate from HKMA:", error);
    return DEFAULT_EXCHANGE_RATE;
  }
};

// 轉換價格的函數，根據貨幣選擇動態顯示
const convertPrice = (usdPrice, currency, exchangeRate) => {
  if (currency === "HKD") {
    const hkdPrice = usdPrice * exchangeRate;
    return `HK$${hkdPrice.toFixed(2)}`;
  }
  return `$${usdPrice.toFixed(2)}`;
};

const App = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDeal, setHoveredDeal] = useState(null);
  const [currency, setCurrency] = useState("HKD");
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);

  useEffect(() => {
    const getExchangeRate = async () => {
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);
    };
    getExchangeRate();
  }, []);

  const fetchDeals = () => {
    setLoading(true);
    fetch(
      "https://www.cheapshark.com/api/1.0/deals?storeID=1&sortBy=Recent&desc=1&pageSize=50"
    )
      .then((response) => response.json())
      .then((data) => {
        const filteredDeals = data
          .filter((deal) => {
            const rating = parseInt(deal.steamRatingPercent || "0", 10);
            return rating >= 70;
          })
          .sort(
            (a, b) =>
              parseInt(b.steamRatingPercent || "0", 10) -
              parseInt(a.steamRatingPercent || "0", 10)
          )
          .map((deal) => ({
            title: deal.title,
            salePrice: deal.salePrice,
            normalPrice: deal.normalPrice,
            savings: Math.round(parseFloat(deal.savings)),
            steamRatingPercent: deal.steamRatingPercent,
            steamAppID: deal.steamAppID,
            thumb: deal.thumb,
            url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
          }))
          .slice(0, 7);

        filteredDeals.forEach((deal, index) => {
          console.log(`Deal ${index + 1} Thumb:`, deal.thumb);
        });

        setDeals(filteredDeals);
        localStorage.setItem("steamDeals", JSON.stringify(filteredDeals));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching deals:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    const cachedDeals = localStorage.getItem("steamDeals");
    if (cachedDeals) {
      setDeals(JSON.parse(cachedDeals));
      setLoading(false);
    } else {
      fetchDeals();
    }
  }, []);

  const toggleCurrency = () => {
    setCurrency(currency === "HKD" ? "USD" : "HKD");
  };

  if (loading) {
    return (
      <div className="text-center p-4 text-gray-600 animate-pulse">
        載入中...
      </div>
    );
  }

  return (
    <div className="w-96 p-4 bg-steam-blue text-white shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-steam-light">Steam 熱門特價</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleCurrency}
            className="text-steam-blue bg-steam-light hover:bg-blue-800 focus:ring-4 focus:steam-light font-medium rounded-lg text-xs px-3 py-1.5 dark:bg-steam-light dark:hover:bg-blue-700 focus:outline-none dark:focus:steam-blue"
          >
            {currency === "HKD" ? "顯示 USD" : "顯示 HKD"}
          </button>
          <button
            onClick={fetchDeals}
            className="text-steam-blue bg-steam-light hover:bg-blue-800 focus:ring-4 focus:steam-light font-medium rounded-lg text-xs px-4 py-1.5 dark:bg-steam-light dark:hover:bg-blue-700 focus:outline-none dark:focus:steam-blue"
          >
            刷新
          </button>
        </div>
      </div>
      {deals.length === 0 ? (
        <p className="text-gray-300">
          目前沒有熱門遊戲，建議在 Steam 大促銷期間查看！
        </p>
      ) : (
        <>
          {deals.every((deal) => deal.savings === 0) && (
            <p className="text-gray-300 text-sm mb-2">
              目前無特價，顯示熱門遊戲列表
            </p>
          )}
          <ul className="space-y-3">
            {deals.map((deal, index) => {
              const highResThumb = deal.steamAppID
                ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID}/capsule_231x87.jpg`
                : deal.thumb;

              const salePriceDisplay = convertPrice(
                parseFloat(deal.salePrice),
                currency,
                exchangeRate
              );
              const normalPriceDisplay = convertPrice(
                parseFloat(deal.normalPrice),
                currency,
                exchangeRate
              );

              return (
                <li
                  key={index}
                  className="border-b border-gray-600 pb-2 h-24 flex items-center relative"
                  onMouseEnter={() => setHoveredDeal(index)}
                  onMouseLeave={() => setHoveredDeal(null)}
                >
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-steam-light hover:underline text-sm flex items-center w-full space-x-2"
                  >
                    <img
                      src={highResThumb}
                      alt={deal.title}
                      className="w-20 h-20 rounded flex-shrink-0 object-contain"
                      style={{ imageRendering: "auto" }}
                    />
                    <div className="flex-1 flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium truncate text-base max-w-[160px]">
                          {deal.title}
                        </span>
                        <span className="text-yellow-400 text-sm mt-1">
                          ({deal.steamRatingPercent}% 好評)
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-[80px] flex flex-col items-end space-y-0.5">
                        <span className="text-green-400 font-semibold text-sm">
                          {salePriceDisplay}
                        </span>
                        {deal.savings > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-xs">
                              {normalPriceDisplay}
                            </span>
                            <span className="text-red-400 text-xs">
                              -{deal.savings}%
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </a>
                  {hoveredDeal === index && (
                    <div className="absolute left-0 top-24 z-10 w-64 p-3 bg-gray-800 text-white rounded-lg shadow-md">
                      <h3 className="text-sm font-bold mb-1">{deal.title}</h3>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default App;
