import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Radio, Checkbox, Slider, Result } from "antd";
import { FrownOutlined } from '@ant-design/icons';
import SelectBus from "../../components/SelectBus/SelectBus";
import { getTripListOptionsAction } from "../../redux/actions/TripAction";
import TripCard from "../../components/TripCard/TripCard";
import { history } from "../../App";

export default function Search(props) {
  const { arrTrip } = useSelector((state) => state.TripReducer);
  const dispatch = useDispatch();
  let searchParams = new URLSearchParams(props.location.search);

  // Use state instead of mutating object
  const [filters, setFilters] = useState({
    sort: "",
    searchBusType: "",
    fromPrice: 500,
    toPrice: 2000,
    from: "",
    to: "",
    dayStart: "",
  });

  useEffect(() => {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const dayStart = searchParams.get('date') || '';
    
    if(from === "" || to === ""){
      history.push("/")
      return;
    }
    
    const initialFilters = {
      ...filters,
      from,
      to,
      dayStart
    };
    
    setFilters(initialFilters);
    dispatch(getTripListOptionsAction(initialFilters));
  }, []);

  // Fixed marks to match actual values
  const marks = {
    500: {
      label: <small>₱500</small>,
    },
    1000: {
      label: <small>₱1,000</small>,
    },
    1500: {
      label: <small>₱1,500</small>,
    },
    2000: {
      style: { color: "#f50" },
      label: <small>₱2,000</small>,
    },
  };

  const handleOnChangeSort = (e) => {
    const newFilters = { ...filters, sort: e.target.value };
    setFilters(newFilters);
    dispatch(getTripListOptionsAction(newFilters));
  };

  const handleOnChangeFilter = (event) => {
    let busTypes = filters.searchBusType;
    
    if (event.target.checked) {
      // Add the bus type
      busTypes += event.target.value + ",";
    } else {
      // Remove the bus type
      busTypes = busTypes.replace(event.target.value + ",", "");
    }
    
    const newFilters = { ...filters, searchBusType: busTypes };
    setFilters(newFilters);
    dispatch(getTripListOptionsAction(newFilters));
  };

  const handleOnChangePrice = (values) => {
    const newFilters = { 
      ...filters, 
      fromPrice: values[0], 
      toPrice: values[1] 
    };
    setFilters(newFilters);
    dispatch(getTripListOptionsAction(newFilters));
  };

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <Card className="mx-2 mt-3">
        <SelectBus props={props}/>
      </Card>

      <div className="flex flex-row flex-wrap py-4">
        <div className="w-full sm:w-1/3 md:w-1/4 px-2">
          <Card title="Sort">
            <Radio.Group onChange={handleOnChangeSort} value={filters.sort}>
              <Radio value="earliest-departure">Earliest departure</Radio>
              <Radio value="latest-departure">Latest departure</Radio>
              <Radio value="lowest-price">Lowest price</Radio>
              <Radio value="highest-price">Highest price</Radio>
            </Radio.Group>
          </Card>
          <Card title="Filter" className="mt-3">
            <Slider
              range
              marks={marks}
              step={10}
              min={500}
              max={2000}
              onAfterChange={handleOnChangePrice}
              defaultValue={[500, 2000]}
              className="mx-4 mb-5"
            />
            <Checkbox value="Express" onChange={handleOnChangeFilter}>Express</Checkbox><br />
            <Checkbox value="Deluxe" onChange={handleOnChangeFilter}>Deluxe</Checkbox><br />
            <Checkbox value="Luxury AC" onChange={handleOnChangeFilter}>Luxury AC</Checkbox><br />
            <Checkbox value="ROYAL CLASS" onChange={handleOnChangeFilter}>ROYAL CLASS</Checkbox>
          </Card>
        </div>
        <div className="w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
          {arrTrip.length > 0
            ? arrTrip?.map((item, index) => {
              return (<div key={index}>
                <TripCard tripDetail={item} />
              </div>
              );
            })
            : <Result
              icon={<FrownOutlined />}
              title="Oops!"
              subTitle="Sorry, we can't found any schedule to this date."
            />
          }
        </div>
      </div>
    </div>
  )
}