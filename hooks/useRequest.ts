import { useState, useEffect, useContext, useCallback } from 'react';
import { DataContext } from '../contexts/data';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRequest<T>(
  url: string,
  defaultValue: T,
  key?: string,
): any {
  const [loading, setLoading] = useState<boolean>(true);
  const [responseData, setResponseData] = useState<any>(null);
  const [data, setData] = useState<T>(defaultValue);
  const dataContext = useContext(DataContext);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetcher(`${process.env.NEXT_PUBLIC_DAT_URL}/${url}`);
      const dataFromKey = key ? data[key] : data?.table_data || data?.chart_data || data;
      setResponseData(dataFromKey)
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [key, url]);

  useEffect(() => {
    init();
  }, [init, url]);

  useEffect(() => {
    if(!responseData) return;

    setData(
      responseData.filter
        ? responseData.filter((line: any) => {
          if (!line.time) {
            return true;
          }
          if (
            dataContext.dates.from &&
            new Date(line.time) < new Date(dataContext.dates.from)
          ) {
            return false;
          }
          if (dataContext.dates.to && new Date(line.time) > new Date(dataContext.dates.to)) {
            return false;
          }
          return true;
        })
        : responseData
    );
  }, [dataContext.dates.from, dataContext.dates.to, responseData])

  return [data, loading];
}
