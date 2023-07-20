import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { useMediaQuery } from "@chakra-ui/react"
import { useEffect, useState } from 'react';
import { useRequest } from '@/hooks/useRequest';
import ChartWrapper, { CoinSelector } from '../../common/chartWrapper';
import {
    CHART_HEIGHT,
} from "../../../constants";
import {
    tooltipFormatter,
    xAxisFormatter,
    formatterPercent,
} from '../../../helpers'
import { getTokenHex } from "../../../constants/tokens";
import {
    funding_rate,
} from "../../../constants/api"

const REQUESTS = [
    funding_rate
];

export default function FundingRate() {
    const [isMobile] = useMediaQuery('(max-width: 700px)');

    const [coinKeys, setCoinKeys] = useState<string[]>([])
    const [formattedData, setFormattedData] = useState<GroupedFundingData[]>([])
    const [dataFundingRate, loadingFundingRate, errorFundingRate] = useRequest(REQUESTS[0], [], 'chart_data');
    const [coinsSelected, setCoinsSelected] = useState<string[]>(["ETH", "BTC", "ARB"]);

    const loading = loadingFundingRate;
    const error = errorFundingRate;

    type FundingData = {
        coin: string,
        sum_funding: number,
        time: string,
    };

    type GroupedFundingData = {
        time: Date;
        [coin: string]: number | Date;
    };

    const groupByTimeAndFilterUnSelected = (data: FundingData[]): GroupedFundingData[] => {
        const map = new Map<string, any>();
        const coinFundingTotals = new Map<string, number>();

        data.forEach((item) => {
            if (!coinsSelected.includes(item.coin)) {
                return;
            }
            const key = item.time;
            if (!map.has(key)) {
                map.set(key, {
                    time: new Date(key),
                    unit: "%"
                });
            }

            const existingEntry = map.get(key);

            const value = (existingEntry[item.coin] || 0) + item.sum_funding;

            existingEntry[item.coin] = value * 100;

            // Update total funding for the coin
            coinFundingTotals.set(item.coin, value * 100);

            map.set(key, existingEntry);
        });

        const result = Array.from(map.values());
        return result;
    };


    const extractUniqueCoins = (fundingData: FundingData[]): string[] => {
        const coinSet = new Set<string>();
        for (const data of fundingData) {
            const {coin} = data;
            if (coin !== 'time' &&
                coin !== 'unit'
            ) {
                coinSet.add(coin);
            }
        };
        return Array.from(coinSet);
    };

    useEffect(() => {
        if (!loading && !error) {
            const uniqueCoins = extractUniqueCoins(dataFundingRate);
            setCoinKeys(uniqueCoins);
        }
    },  [loading, dataFundingRate])

    const formatData = () => {
        if (dataFundingRate) {
            const groupedAndFilteredData = groupByTimeAndFilterUnSelected(dataFundingRate);
            setFormattedData(groupedAndFilteredData);
        }
    }

    useEffect(() => {
        if (!loading && !error) {
            formatData();
        }
    }, [loading, coinsSelected])


    const coinSelectorsSort = (a: CoinSelector, b: CoinSelector) => {
        if (a.isChecked !== b.isChecked) {
          return a.isChecked ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    }

    const coinSelectors = coinKeys.map((coinKey) => {
        return ({
            name: coinKey,
            event: () => setCoinsSelected(coinsSelected => {
                let newCoinsSelected = coinsSelected;
                if (coinsSelected.includes(coinKey)) {
                    newCoinsSelected = coinsSelected.filter((e) => { return e !== coinKey });
                } else {
                    newCoinsSelected.push(coinKey);
                }
                formatData();
                return newCoinsSelected;
            }),
            isChecked: coinsSelected.includes(coinKey),
        });
    }).sort((a:CoinSelector, b: CoinSelector) => coinSelectorsSort(a, b));

    return (
        <ChartWrapper
            title="Annualized Funding Rate"
            loading={loading}
            data={formattedData}
            coinSelectors={coinSelectors}
        >
            <ResponsiveContainer width="100%" height={CHART_HEIGHT + 125}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="15 15" opacity={0.1} />
                    <XAxis dataKey="time" tickFormatter={xAxisFormatter} minTickGap={30}
                        tick={{ fill: '#f9f9f9', fontSize: isMobile ? 14 : 15 }}
                        tickMargin={10}
                    />
                    <YAxis
                        tick={{ fill: '#f9f9f9', fontSize: isMobile ? 14 : 15 }}
                        dx={6}
                        width={75}
                        tickFormatter={formatterPercent}
                    />
                    <Tooltip
                        formatter={tooltipFormatter}
                        labelFormatter={() => ''}
                        contentStyle={{
                            textAlign: 'left',
                            background: "#0A1F1B",
                            borderColor: "#061412",
                            color: "#fff",
                            boxShadow: "0px 0px 7px rgb(0 0 0 / 20%)",
                            borderRadius: "26px",
                            maxHeight: "500px"
                        }}
                        itemSorter={(item) => {
                            return Number(item.value) * -1;
                        }}
                    />
                    <Legend wrapperStyle={{ bottom: -5 }} />
                    {
                        coinsSelected.map(((coinName, i) => {
                            return (
                                <Line
                                    isAnimationActive={false}
                                    dataKey={coinName.toString()}
                                    dot={false}
                                    name={coinName.toString()}
                                    stroke={getTokenHex(coinName.toString())}
                                    key={'funding-rate-line-' + i}
                                />
                            )
                        }))
                    }
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    )
}
