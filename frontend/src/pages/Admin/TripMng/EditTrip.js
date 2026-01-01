import React, { useEffect, useState } from 'react'
import { Form, Button, Select, Input, DatePicker } from 'antd';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { getEnableBusListAction } from '../../../redux/actions/BusAction';
import { getStationListAction } from '../../../redux/actions/StationAction';
import { getDriverAction } from '../../../redux/actions/DriverAction';
import { getTripByIdAction, updateTripAction } from '../../../redux/actions/TripAction';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DOMAIN } from '../../../util/settings/config';

dayjs.extend(isBetween);

export default function EditTrip(props) {
    const dispatch = useDispatch();
    const [imgSrc, setImgSrc] = useState('');
    const { RangePicker } = DatePicker;
    const { tripDetail } = useSelector(state => state.TripReducer);
    let { arrEnableBus = [] } = useSelector(state => state.BusReducer);
    let { arrStation = [] } = useSelector(state => state.StationReducer);
    let { arrDriver = [] } = useSelector(state => state.DriverReducer);
    const [arrDriverNew, setArrDriverNew] = useState([]);
    const [arrEnableBusNew, setArrEnableBusNew] = useState([]);
    let { id } = props.match.params;
    
    useEffect(() => {
        dispatch(getTripByIdAction(id));
        dispatch(getEnableBusListAction());
        dispatch(getStationListAction());
        dispatch(getDriverAction());
    }, [dispatch, id]);

    useEffect(() => {
        setArrDriverNew(arrDriver || []);
        setArrEnableBusNew(arrEnableBus || []);
    }, [arrDriver, arrEnableBus]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            StartTime: tripDetail?.startTime || '',
            FinishTime: tripDetail?.finishTime || '',
            TicketPrice: tripDetail?.ticketPrice || '',
            BusId: tripDetail?.busId || '',
            DriverId: tripDetail?.driverId || '',
            FromStationId: tripDetail?.fromStationId || '',
            ToStationId: tripDetail?.toStationId || '',
            Image: tripDetail?.image || '',
        },
        onSubmit: async (values) => {
            console.log('Submitting values:', values);
            
            // Validate required fields
            if (!values.StartTime || !values.FinishTime) {
                alert('Please select start and finish time');
                return;
            }
            if (!values.BusId) {
                alert('Please select a bus');
                return;
            }
            if (!values.DriverId) {
                alert('Please select a driver');
                return;
            }
            if (!values.FromStationId || !values.ToStationId) {
                alert('Please select from and to stations');
                return;
            }
            
            // Always use FormData because backend uses [FromForm]
            let formData = new FormData();
            
            formData.append('Id', id);
            formData.append('StartTime', dayjs(values.StartTime).toISOString());
            formData.append('FinishTime', dayjs(values.FinishTime).toISOString());
            formData.append('TicketPrice', values.TicketPrice || '0');
            formData.append('BusId', values.BusId);
            formData.append('DriverId', values.DriverId);
            formData.append('FromStationId', values.FromStationId);
            formData.append('ToStationId', values.ToStationId);
            
            // Handle image - send as UploadImage (matches backend model)
            if (values.Image && typeof values.Image !== 'string') {
                // New file uploaded
                formData.append('UploadImage', values.Image);
            } else if (values.Image && typeof values.Image === 'string' && values.Image !== '') {
                // Keep existing image - send the filename as Image property
                formData.append('Image', values.Image);
            } else {
                // No image
                formData.append('Image', '');
            }
            
            console.log('Sending FormData');
            console.log('FormData contents:', [...formData.entries()]);
            dispatch(updateTripAction(id, formData));
        }
    });

    const handleChangeBus = (value) => {
        formik.setFieldValue('BusId', value);
    };
    
    const handleChangeFromStation = (value) => {
        formik.setFieldValue('FromStationId', value);
    };
    
    const handleChangeToStation = (value) => {
        formik.setFieldValue('ToStationId', value);
    };

    const handleChangeDriver = (value) => {
        formik.setFieldValue('DriverId', value);
    };

    const onChangeDate = (value) => {
        if (!value || value.length !== 2) return;
        
        formik.setFieldValue('StartTime', value[0]);
        formik.setFieldValue('FinishTime', value[1]);
        
        // Filter available drivers
        setArrDriverNew((arrDriver || []).filter((driver) => {
            const hasConflict = (driver.trips || []).some((trip) => {
                const tripStart = dayjs(trip.startTime);
                const tripFinish = dayjs(trip.finishTime);
                const newStart = dayjs(value[0]);
                const newFinish = dayjs(value[1]);
                
                // Skip the current trip being edited
                if (trip.id === parseInt(id)) return false;
                
                // Check for time overlap
                return tripStart.isBetween(newStart, newFinish, null, '[]') || 
                       tripFinish.isBetween(newStart, newFinish, null, '[]') ||
                       newStart.isBetween(tripStart, tripFinish, null, '[]') ||
                       newFinish.isBetween(tripStart, tripFinish, null, '[]');
            });
            return !hasConflict;
        }));
        
        // Filter available buses
        setArrEnableBusNew((arrEnableBus || []).filter((bus) => {
            const hasConflict = (bus.trips || []).some((trip) => {
                const tripStart = dayjs(trip.startTime);
                const tripFinish = dayjs(trip.finishTime);
                const newStart = dayjs(value[0]);
                const newFinish = dayjs(value[1]);
                
                // Skip the current trip being edited
                if (trip.id === parseInt(id)) return false;
                
                // Check for time overlap
                return tripStart.isBetween(newStart, newFinish, null, '[]') || 
                       tripFinish.isBetween(newStart, newFinish, null, '[]') ||
                       newStart.isBetween(tripStart, tripFinish, null, '[]') ||
                       newFinish.isBetween(tripStart, tripFinish, null, '[]');
            });
            return !hasConflict;
        }));
    };

    const onOk = (value) => {
        onChangeDate(value);
    };

    const handleChangeFile = (e) => {
        let file = e.target.files[0];

        if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                setImgSrc(e.target.result);
            };
            formik.setFieldValue('Image', file);
        }
    };

    return (
        <div className="container">
            <Form
                onSubmitCapture={formik.handleSubmit}
                labelCol={{
                    span: 6,
                }}
                wrapperCol={{
                    span: 14,
                }}
                layout="horizontal"
            >
                <h3 className="text-2xl">Edit Trip</h3>
                <div className='row'>
                    <Form.Item
                        label="Start and Finish Time"
                        style={{ minWidth: '100%' }}
                    >
                        <RangePicker
                            id="date"
                            disabledDate={d => d.isBefore(dayjs())}
                            showTime={{ format: 'HH:mm' }}
                            format="DD-MM-YYYY h:mm A"
                            value={
                                formik.values.StartTime && formik.values.FinishTime
                                    ? [
                                        dayjs(formik.values.StartTime),
                                        dayjs(formik.values.FinishTime)
                                    ]
                                    : null
                            }
                            onChange={(dates) => {
                                if (!dates || dates.length !== 2) return;
                                formik.setFieldValue('StartTime', dates[0]);
                                formik.setFieldValue('FinishTime', dates[1]);

                                // Filter available drivers and buses
                                onChangeDate(dates);
                            }}
                            onOk={(dates) => {
                                if (!dates || dates.length !== 2) return;
                                onOk(dates);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Ticket Price"
                        style={{ minWidth: '100%' }}
                    >
                        <Input 
                            name="TicketPrice" 
                            type='number' 
                            prefix={"₱"} 
                            onChange={formik.handleChange} 
                            value={formik.values.TicketPrice} 
                        />
                    </Form.Item>

                    <Form.Item
                        label="From Station"
                        style={{ minWidth: '100%' }}
                    >
                        <Select 
                            options={(arrStation || [])
                                .filter(x => x.id !== formik.values.ToStationId)
                                .map((item, index) => ({ 
                                    key: index, 
                                    label: item?.name, 
                                    value: item.id 
                                }))} 
                            onChange={handleChangeFromStation} 
                            value={formik.values.FromStationId} 
                            placeholder='Please select From Station' 
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label="To Station"
                        style={{ minWidth: '100%' }}
                    >
                        <Select 
                            options={(arrStation || [])
                                .filter(x => x.id !== formik.values.FromStationId)
                                .map((item, index) => ({ 
                                    key: index, 
                                    label: item.name, 
                                    value: item.id 
                                }))} 
                            onChange={handleChangeToStation} 
                            value={formik.values.ToStationId} 
                            placeholder='Please select To Station' 
                        />
                    </Form.Item>

                    <Form.Item
                        label="Assigned Bus"
                        style={{ minWidth: '100%' }}
                    >
                        <Select 
                            placeholder="Assign bus for this trip" 
                            options={(arrEnableBusNew || [])
                                .filter(({ stations }) =>
                                    (stations || []).some(x => x.id === formik.values.FromStationId))
                                .map((item, index) => ({
                                    key: index, 
                                    label: `${item.busPlate} (${item.busType?.name})`, 
                                    value: item.id
                                }))}
                            onChange={handleChangeBus} 
                            value={formik.values.BusId} 
                        />
                    </Form.Item>

                    <Form.Item
                        label="Assigned Driver"
                        style={{ minWidth: '100%' }}
                    >
                        <Select 
                            placeholder="Assign driver for this trip" 
                            options={(arrDriverNew || []).map((item, index) => ({ 
                                key: index, 
                                label: item.fullName, 
                                value: item.id 
                            }))} 
                            value={formik.values.DriverId} 
                            onChange={handleChangeDriver} 
                        />
                    </Form.Item>

                    <Form.Item label="Image" style={{ minWidth: '100%' }}>
                        <input 
                            type="file" 
                            name="Image" 
                            onChange={handleChangeFile} 
                            accept="image/png, image/jpeg, image/jpg" 
                        />
                        <br />
                        <img 
                            style={{ 
                                width: 200, 
                                height: 200, 
                                objectFit: 'cover', 
                                borderRadius: '6px',
                                marginTop: '10px' 
                            }} 
                            src={imgSrc || (typeof formik.values.Image === 'string' ? `${DOMAIN}/Images/Trip/${formik.values.Image}` : '')} 
                            alt="Trip" 
                        />
                    </Form.Item>
                    
                    <Form.Item label="Action" style={{ minWidth: '100%' }}>
                        <Button htmlType="submit" type="primary">Update Trip</Button>
                    </Form.Item>
                </div>
            </Form>
        </div>
    );
}