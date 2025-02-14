import { useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Select from 'react-dropdown-select';
import { Box } from '@chakra-ui/react';
import moment from 'moment';
import { DateRange } from 'react-date-range';
import strftime from 'strftime';
import { DataContext } from '../../../contexts/data';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const ALL_TIME_ID = 4;
const DATA_START_DATE = new Date('2023-06-14T20:00:00.000');
const DATE_NOW = new Date();

export const DateRangeSelect = () => {
  const { setDates, dates } = useContext(DataContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedDateRangeOption, setSelectedDateRangeOption] = useState<number | null>(null);

  const isValidDate = (dateString: string) => {
    return moment(dateString, 'MM-DD-YY', true).isValid();
  };

  const getInitialDate = (key: string, fallback: Date) => {
    const param = searchParams.get(key);
    if (!param || !isValidDate(param)) return fallback;
    const date = moment(param, 'MM-DD-YY').toDate();
    if (key === 'from' && date < DATA_START_DATE) return DATA_START_DATE;
    if (key === 'to' && date > DATE_NOW) return DATE_NOW;
    return date;
  };

  const initialFrom = getInitialDate('from', DATA_START_DATE);
  const initialTo = getInitialDate('to', DATE_NOW);
  const correctedFrom = initialFrom > initialTo ? DATA_START_DATE : initialFrom;
  const correctedTo = initialFrom > initialTo ? DATE_NOW : initialTo;

  const [rangeState, setRangeState] = useState({
    startDate: correctedFrom,
    endDate: correctedTo,
    key: 'selection',
  });

  const updateQueryParams = (from: Date, to: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set('from', strftime('%m-%d-%y', from));
    else params.delete('from');
    if (to) params.set('to', strftime('%m-%d-%y', to));
    else params.delete('to');
    router.push(`?${params.toString()}`);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  useEffect(() => {
    updateQueryParams(rangeState.startDate, rangeState.endDate);
    setDates({
      from: strftime('%Y-%m-%d', rangeState.startDate),
      to: strftime('%Y-%m-%d', rangeState.endDate),
    });
  }, []);

  const onChange = (selectedDates: any) => {
    const [start, end] = selectedDates;
    const from = start ? strftime('%Y-%m-%d', new Date(start)) : undefined;
    const to = end ? strftime('%Y-%m-%d', end) : undefined;
    if (from === to || !from || !to) return;
    setRangeState({ startDate: new Date(from), endDate: new Date(to), key: 'selection' });
    setDates({ from, to });
    if (from && to) {
      updateQueryParams(start, end);
    }
  };

  const dateRangeOptions = [
    {
      label: 'Last Month',
      id: 1,
    },
    {
      label: 'All Time',
      id: 4,
      isDefault: true,
    },
  ];

  const onSelectItem = (option: { id: number; label: string; isDefault?: boolean }) => {
    if (option.id == ALL_TIME_ID) {
      onChange([null, null]);
      return;
    }
    const end = new Date();
    const start = moment().subtract(option.id, 'month').toDate();
    setSelectedDateRangeOption(option.id);
    if (option.id == ALL_TIME_ID) {
      onChange([null, null]);
    } else {
      onChange([start, end]);
    }
  };

  useEffect(() => {
    let selected = false;
    for (const option of dateRangeOptions) {
      if (option.isDefault) {
        selected = true;
        onSelectItem(option);
        break;
      }
    }
    if (!selected) {
      onSelectItem(dateRangeOptions[0]);
    }
  }, []);

  const onDateRangeChange = (item: any) => {
    if (item.selection.startDate == item.selection.endDate) {
      return;
    }
    onChange([item.selection.startDate, item.selection.endDate]);
  };

  const customContentRenderer = () => {
    return (
      <div style={{ cursor: 'pointer' }}>
        {rangeState.startDate &&
          rangeState.endDate &&
          `${strftime('%m-%d-%y', rangeState.startDate)} to ${strftime(
            '%m-%d-%y',
            rangeState.endDate
          )}`}
        {(!rangeState.startDate || !rangeState.endDate) && 'All time'}
      </div>
    );
  };

  const customDropdownRenderer = ({ props, state }: any) => {
    return (
      <Box className='react-datepicker'>
        <Box className='date-range-custom' color={props.color}>
          <DateRange
            editableDateInputs={true}
            onChange={onDateRangeChange}
            moveRangeOnFirstSelection={false}
            ranges={[rangeState]}
            showDateDisplay={false}
            fixedHeight={false}
            minDate={DATA_START_DATE}
            maxDate={DATE_NOW}
            rangeColors={['#194D44', '#194D44', '#194D44']}
          />
        </Box>
      </Box>
    );
  };

  const selectedOption = dateRangeOptions.find((option) => option.id === selectedDateRangeOption);
  const values = selectedOption ? [selectedOption] : [];

  const handleSelectChange = () => {
    // console.log('handleSelectChange')
  };

  return (
    <Box className='date-range-selector-wrapper' w='340px'>
      <Select
        placeholder='Select'
        multi
        contentRenderer={customContentRenderer}
        dropdownRenderer={customDropdownRenderer}
        labelField='label'
        options={dateRangeOptions}
        closeOnSelect={true}
        closeOnScroll={true}
        values={values}
        onChange={handleSelectChange}
      />
    </Box>
  );
};
