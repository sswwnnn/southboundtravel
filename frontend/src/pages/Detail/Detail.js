import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Form, Input, Tabs, InputNumber, notification, Timeline, Upload, Modal } from 'antd';
import { UserOutlined, HomeOutlined, CreditCardOutlined, KeyOutlined, UploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './Detail.css'
import './IdVerification.css' 
import { CHUYEN_TAB_ACTIVE } from '../../redux/constants';
import _ from 'lodash';
import { TOKEN } from '../../util/settings/config';
import dayjs from 'dayjs';
import { bookSeatAction, bookTicketAction, orderConfirmAction } from '../../redux/actions/OrderAction';
import { Ticket } from './../../_core/models/Ticket';
import UserAvatar from '../../components/UserAvatar/UserAvatar';
import { getCurrentUserAction } from '../../redux/actions/UserAction';
import TicketLeaf from '../../components/TicketLeaf/TicketLeaf';
import { getOfferByCodeAction } from '../../redux/actions/OfferAction';
const { TabPane } = Tabs;
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.guess()


export default function Detail(props) {
    const { donHang } = useSelector(state => state.OrderReducer)
    const { disableTab } = useSelector(state => state.OrderReducer)
    const { tabActive } = useSelector(state => state.OrderReducer)
    const { userLogin } = useSelector(state => state.UserReducer);
    const dispatch = useDispatch();

    let accessToken = {}
    if (localStorage.getItem(TOKEN)) {
        accessToken = localStorage.getItem(TOKEN)
    }

    useEffect(() => {
        if (accessToken != null) {
            dispatch(getCurrentUserAction(accessToken))
        }
        dispatch({
            type: CHUYEN_TAB_ACTIVE,
            number: '1'
        })
    }, [dispatch])


    const operations = <Fragment>
        {_.isEmpty(userLogin) ? <Fragment>
            <Button type="text" href="/register" className="text-white">Sign Up</Button>
            <Button type="primary" href="/login" className="font-semibold bg-violet-400">Sign In</Button>
        </Fragment> : <div className="d-flex">
            <Button type="link" href="/"><HomeOutlined style={{ fontSize: '24px' }} /></Button>
            <UserAvatar />
        </div>}
    </Fragment>

    return <div className='container p-4'>
        <Tabs tabBarExtraContent={operations} defaultActiveKey='1' activeKey={tabActive} onChange={(key) => {
            dispatch({
                type: CHUYEN_TAB_ACTIVE,
                number: key
            })
        }}>
            <TabPane disabled={!donHang || disableTab} tab='01 CONFIRM YOUR ORDER' key='1' >
                <SettlePayment {...props} />
            </TabPane>
            <TabPane disabled={!donHang || disableTab} tab='02 GET YOUR E-TICKET' key='2' >
                <KetQuaDatVe {...props} />
            </TabPane>
        </Tabs>
    </div>

}


export function SettlePayment(props) {
    let { donHang } = useSelector(state => state.OrderReducer)
    let { offerCodeDetail } = useSelector(state => state.OfferReducer)
    const [show, setShow] = useState(false);
    const [children, setChildren] = useState(0);
    const [students, setStudents] = useState(0);
    const [senior, setSenior] = useState(0);
    let [voucherDiscount, setVvoucherDiscount] = useState(0);
    
    // id verification states
    const [childrenFiles, setChildrenFiles] = useState([]);
    const [studentsFiles, setStudentsFiles] = useState([]);
    const [seniorFiles, setSeniorFiles] = useState([]);
    const [showIdInfo, setShowIdInfo] = useState(false);

    const handleChangeChildren = (value) => {
        setChildren(value);
        if (value === 0) setChildrenFiles([]);
    }
    
    const handleChangeStudents = (value) => {
        setStudents(value);
        if (value === 0) setStudentsFiles([]);
    }
    
    const handleChangeSenior = (value) => {
        setSenior(value);
        if (value === 0) setSeniorFiles([]);
    }

    const totalTicket = donHang && donHang?.numberOfSeat - children - students - senior;
    const totalPrice = donHang && donHang?.totalMoney;
    const discount = donHang && children * donHang?.ticketPrice + students * donHang?.ticketPrice * 0.2 + senior * donHang?.ticketPrice * 0.2
    const priceBeforeVoucher = totalPrice - discount;


    const checkTime = dayjs().isBetween(dayjs(offerCodeDetail?.beginDate), dayjs(offerCodeDetail?.endDate), 'date')
    const checkStation = offerCodeDetail?.fromStation == donHang?.fromStation && offerCodeDetail?.toStation == donHang?.toStation || (offerCodeDetail?.fromStation == null && offerCodeDetail?.toStation == null) || (offerCodeDetail?.fromStation == 'null' && offerCodeDetail?.toStation == 'null')
    
    if (offerCodeDetail?.offerCode != null && checkTime == true && checkStation == true) {
        voucherDiscount = priceBeforeVoucher * offerCodeDetail?.discount / 100;
    }else{
        voucherDiscount = -1;
    }

    const finalPrice = voucherDiscount > 0 ? priceBeforeVoucher - voucherDiscount : priceBeforeVoucher;

    // file upload handlers
    const uploadProps = (fileList, setFileList, category) => ({
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/') || file.type === 'application/pdf';
            if (!isImage) {
                notification.error({
                    message: 'Invalid File Type',
                    description: 'You can only upload image or PDF files!',
                });
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                notification.error({
                    message: 'File Too Large',
                    description: 'File must be smaller than 5MB!',
                });
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        fileList: fileList,
        maxCount: 2,
        multiple: true,
        accept: 'image/*,.pdf'
    });

    const validateIdUploads = () => {
        if (children > 0 && childrenFiles.length === 0) {
            notification.error({
                message: 'ID Verification Required',
                description: 'Please upload birth certificate or parent/guardian declaration for children discount.',
            });
            return false;
        }
        if (students > 0 && studentsFiles.length === 0) {
            notification.error({
                message: 'ID Verification Required',
                description: 'Please upload valid School ID or enrollment certificate for student discount.',
            });
            return false;
        }
        if (senior > 0 && seniorFiles.length === 0) {
            notification.error({
                message: 'ID Verification Required',
                description: 'Please upload valid PWD ID or Senior Citizen ID for discount.',
            });
            return false;
        }
        return true;
    };

    const onFinish = (values) => {
        if (children == donHang?.numberOfSeat) {
            notification.error({
                closeIcon: true,
                message: 'Error',
                description: (
                    <>
                        Children must be accompanied by an adult<br></br>
                        Must have at least one adult.
                    </>
                ),
            });
        } else if (!validateIdUploads()) {
            return;
        } else {
            setShow(true)
        }
    };

    const checkDiscount = (values) => {
        if (values?.offerCode != null) {
            dispatch(getOfferByCodeAction(values?.offerCode))
            setVvoucherDiscount(priceBeforeVoucher * offerCodeDetail?.discount / 100);
        }
    }

    const handleSubmit = (values) => {
        if (values.otp == '123456') {
            const ticket = new Ticket();
            const timeStamp = dayjs().tz("Asia/Saigon").format("YYYYMMDDhhmmss")
            ticket.TripId = donHang.tripId;
            ticket.Code = timeStamp;
            ticket.BookDate = dayjs().tz("Asia/Saigon")
            ticket.UserId = donHang.userId;
            ticket.SeatsList = donHang.seatsList;
            ticket.TotalPrice = finalPrice;
            ticket.isCancel = false;
            ticket.Note = `${children} children + ${students} student + ${senior} pwd/senior citizen`

            donHang = { ...donHang, note: ticket.Note, code: ticket.Code, bookDate: ticket.BookDate }
            dispatch(orderConfirmAction(donHang))
            dispatch(bookSeatAction(ticket))
            dispatch(bookTicketAction(ticket))
        } else {
            notification.error({
                closeIcon: true,
                message: 'Error',
                description: (
                    <>OTP is incorrect</>
                ),
            });
        }
    };

    const dispatch = useDispatch();
    
    return (
        <div className='container min-h-screen mt-2'>
            {}
            <Modal
                title={<><InfoCircleOutlined className="mr-2" />ID Verification Requirements</>}
                open={showIdInfo}
                onCancel={() => setShowIdInfo(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setShowIdInfo(false)}>
                        Got it
                    </Button>
                ]}
                width={700}
            >
                <div className="id-requirements-modal">
                    <h4>Required Documents for Discount Eligibility:</h4>
                    
                    <div className="requirement-section">
                        <h5>Under 5 years old (100% discount)</h5>
                        <ul>
                            <li>Birth Certificate, or</li>
                            <li>Parent/Guardian declaration form (available at ticket counter)</li>
                        </ul>
                        <p className="note">Note: Age is verified at the ticket counter before boarding</p>
                    </div>

                    <div className="requirement-section">
                        <h5>Students (20% discount)</h5>
                        <ul>
                            <li>Valid School ID (current school year), or</li>
                            <li>Official Enrollment Certificate or Certificate of Registration</li>
                        </ul>
                        <p className="note">Note: ID must be current and not expired</p>
                    </div>

                    <div className="requirement-section">
                        <h5>PWD/Senior Citizen (20% discount)</h5>
                        <ul>
                            <li><strong>For PWD:</strong> PWD ID issued by DSWD or local government unit</li>
                            <li><strong>For Senior Citizens:</strong> Senior Citizen ID issued by OSCA or local government unit</li>
                        </ul>
                        <p className="note">Note: Valid government-issued ID required</p>
                    </div>

                    <div className="upload-tips">
                        <h5>Upload Tips:</h5>
                        <ul>
                            <li>Accepted formats: JPG, PNG, PDF (Max 5MB per file)</li>
                            <li>Ensure ID/document is clearly visible</li>
                            <li>You can upload up to 2 files per category</li>
                            <li>Documents will be verified before boarding</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            <div className="row alert alert-primary" role="alert">
                <div className="d-flex justify-between align-items-center">
                    <div>Please enter the number of passengers according to the classification below to receive discount:</div>
                    <Button 
                        type="link" 
                        icon={<InfoCircleOutlined />} 
                        onClick={() => setShowIdInfo(true)}
                        className="id-info-button"
                    >
                        View ID Requirements
                    </Button>
                </div>
                <div className='w-full mt-3 mx-5'><b>Number of unclassified tickets: {totalTicket}</b></div>
                <div className='discount-categories mx-5'>
                    {/* Children Category */}
                    <div className="discount-item">
                        <div className="discount-header">
                            <i className="fa-solid fa-person fa-lg mr-2"></i>
                            <span>Under 5 years old (discount 100%):</span>
                        </div>
                        <InputNumber 
                            addonBefore={<UserOutlined />} 
                            onChange={handleChangeChildren} 
                            name="children" 
                            min={0} 
                            max={donHang?.numberOfSeat - students - senior} 
                            className="p-2" 
                            type="number" 
                        />
                        {children > 0 && (
                            <div className="id-upload-section">
                                <Upload {...uploadProps(childrenFiles, setChildrenFiles, 'children')}>
                                    <Button icon={<UploadOutlined />} className="upload-button">
                                        Upload Birth Cert./Declaration {childrenFiles.length > 0 && `(${childrenFiles.length})`}
                                    </Button>
                                </Upload>
                                <small className="upload-hint">Required: Birth certificate or parent/guardian declaration</small>
                            </div>
                        )}
                    </div>

                    {/* Students Category */}
                    <div className="discount-item">
                        <div className="discount-header">
                            <i className="fa-solid fa-person fa-lg mr-2"></i>
                            <span>Students (discount 20%):</span>
                        </div>
                        <InputNumber 
                            addonBefore={<UserOutlined />} 
                            onChange={handleChangeStudents} 
                            name="students" 
                            min={0} 
                            max={donHang?.numberOfSeat - children - senior} 
                            className="p-2" 
                            type="number" 
                        />
                        {students > 0 && (
                            <div className="id-upload-section">
                                <Upload {...uploadProps(studentsFiles, setStudentsFiles, 'students')}>
                                    <Button icon={<UploadOutlined />} className="upload-button">
                                        Upload School ID/Certificate {studentsFiles.length > 0 && `(${studentsFiles.length})`}
                                    </Button>
                                </Upload>
                                <small className="upload-hint">Required: Valid school ID or enrollment certificate</small>
                            </div>
                        )}
                    </div>

                    {/* PWD/Senior Citizen Category */}
                    <div className="discount-item">
                        <div className="discount-header">
                            <i className="fa-solid fa-person fa-lg mr-2"></i>
                            <span>PWD/Senior Citizen (discount 20%):</span>
                        </div>
                        <InputNumber 
                            addonBefore={<UserOutlined />} 
                            onChange={handleChangeSenior} 
                            name="senior" 
                            min={0} 
                            max={donHang?.numberOfSeat - children - students} 
                            className="p-2" 
                            type="number" 
                        />
                        {senior > 0 && (
                            <div className="id-upload-section">
                                <Upload {...uploadProps(seniorFiles, setSeniorFiles, 'senior')}>
                                    <Button icon={<UploadOutlined />} className="upload-button">
                                        Upload PWD/Senior Citizen ID {seniorFiles.length > 0 && `(${seniorFiles.length})`}
                                    </Button>
                                </Upload>
                                <small className="upload-hint">Required: Valid PWD or Senior Citizen ID</small>
                            </div>
                        )}
                    </div>
                </div>
                
                <div><small className='text-gray-700'>(*) ID verification is mandatory for all discounted tickets. Documents will be checked before boarding.</small></div>
            </div>
            <div className='row'>
                <div className='col-6 w-full alert alert-light' style={{ height: 540 }}>
                    <p className="font-bold">Your order detail</p>
                    <div className='row'>
                        <div className="col-6">
                            <Timeline
                                items={[
                                    {
                                        color: 'red',
                                        children: (
                                            <>
                                                <div><b>{donHang?.fromStation}</b></div>
                                                <div>{dayjs(donHang?.startTime).format('DD-MM-YYYY h:mm A')}</div>
                                            </>
                                        ),
                                    },
                                    {
                                        children: (
                                            <>
                                                <div><b>{donHang?.toStation}</b></div>
                                                <div>{dayjs(donHang?.finishTime).format('DD-MM-YYYY h:mm A')}</div>
                                            </>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                        <div className="pl-5 col-6">
                            <div className='d-flex justify-between'><div>Bus Number:</div>{donHang?.busPlate}</div>
                            <div className='d-flex justify-between'><div>Bus Type:</div>{donHang?.busType} ({donHang?.numberOfSeat} seats)</div>
                            <div className='d-flex justify-between'><div>Driver:</div>{donHang?.driver}</div>
                            <div className='d-flex justify-between'><div>Ticket Price:</div><b>₱{donHang?.ticketPrice}/seat</b></div>
                            <div className='d-flex justify-between'><div >Your selected seats:</div><b>{donHang?.seatList}</b></div>
                        </div>
                    </div>
                    <hr></hr>
                    <div className='d-flex justify-between mt-3'>
                        <p className="font-bold">Total Price</p>
                        <h3 className='font-bold'>{totalPrice?.toLocaleString("en-US", { style: "currency", currency: "PHP" })}</h3>
                    </div>
                    <div className='d-flex justify-between'>
                        <p>Discount</p>
                        <h3>{discount?.toLocaleString("en-US", { style: "currency", currency: "PHP" })}</h3>
                    </div>

                    <hr></hr>
                    {/* Apply Discount */}
                    <div className='d-flex justify-between align-middle mt-3'>
                        <p className="font-bold whitespace-nowrap mr-20">Discount Code</p>
                        <Form
                            name="basic"
                            onFinish={checkDiscount}
                            autoComplete="off"
                            className='flex w-full mt-2'
                        >
                            <Form.Item
                                name="offerCode"
                                className='w-full'
                            >
                                <Input size="large" placeholder='Enter Discount Code' />
                            </Form.Item>
                            <div >
                                <button type="submit" className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm py-2.5 px-2 w-full ml-2 whitespace-nowrap dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
                                >Apply Code</button>
                            </div>
                        </Form>
                    </div>
                    <div className='d-flex justify-between'>
                        <p>Discount Rate</p>
                        <h3>{offerCodeDetail?.discount}%</h3>
                    </div>
                    <div className='d-flex justify-between'>
                        <p>Discount Coupon applied</p>
                        <h3 className={voucherDiscount > 0 ? "text-red-500" : "font-bold"}>{voucherDiscount > 0 ? voucherDiscount.toLocaleString("en-US", { style: "currency", currency: "PHP" }) : 'Voucher not valid'}</h3>
                    </div>

                    <hr></hr>

                    <div className='d-flex justify-between mt-3'>
                        <p className="font-bold">Final Price</p>
                        <h3 className='text-xl font-bold text-red-600'>{finalPrice?.toLocaleString("en-US", { style: "currency", currency: "PHP" })}</h3>
                    </div>
                    <p className='text-gray-400 m-2'>(*) Please check the information carefully before proceeding to the next step.</p>

                </div>
                <div className='col-6 '>
                    <div className='row ml-3 alert alert-light' style={{ height: 540 }}>
                        <div className='m-auto'>
                            <h1 className='text-center text-xl my-5'>PAYMENT BY CREDIT CARD</h1>
                            {!show ? <Form
                                name="basic"
                                onFinish={onFinish}
                                autoComplete="off"
                                style={{ width: 370 }}
                            >
                                <Form.Item
                                    name="cardnumber"
                                    rules={[
                                        {
                                            required: true,
                                            type: 'string',
                                            min: 16,
                                            max: 19,
                                            message: 'Card number must have 16-19 digits and can not be blank!',
                                        },
                                    ]}
                                >
                                    <Input size="large" onInput={e => e.target.value = e.target.value.replace(/(\d{4})(\d+)/g, '$1 $2').trim()} placeholder='Card number' prefix={<CreditCardOutlined />} />
                                </Form.Item>

                                <Form.Item
                                    name="cardholder"
                                    rules={[
                                        {
                                            required: true,
                                            type: 'string',
                                            message: 'Card holder cannot be blank',
                                        },
                                    ]}
                                >
                                    <Input size="large" placeholder='Card holder name' onInput={e => {
                                        e.target.value = e.target.value.toUpperCase()
                                        e.target.value = e.target.value.normalize("NFD")
                                        e.target.value = e.target.value.replace(/[\u0300-\u036f]/g, "")
                                        e.target.value = e.target.value.replace(/đ/g, "d")
                                        e.target.value = e.target.value.replace(/Đ/g, "D");
                                    }} prefix={<UserOutlined />} />
                                </Form.Item>
                                <button type="submit" className='focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 w-full'
                                >Continue</button>
                            </Form>
                                : <Form
                                    name="basic"
                                    onFinish={handleSubmit}
                                    autoComplete="off"
                                    style={{ width: 370 }}
                                >
                                    <Form.Item
                                        name="otp"
                                        rules={[
                                            {
                                                required: true,
                                                type: 'string',
                                                min: 6,
                                                max: 6,
                                                message: 'OTP has 6 digit and cannot be blank!',
                                            },
                                        ]}
                                    >
                                        <Input size="large" placeholder='Enter OTP' prefix={<KeyOutlined />} />
                                    </Form.Item>
                                    <div className='mt-5 d-flex justify-center'>
                                        <button type="submit" style={{ width: 350 }} className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 w-full"

                                        >Confirm Payment</button>

                                    </div>
                                </Form>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}



export function KetQuaDatVe(props) {
    const { donHang } = useSelector(state => state.OrderReducer)

    return <div className='row'>
        <div className='col-12'>
            <section className="text-gray-600 body-font">
                <div className="container px-5 py-24 mx-auto">
                    <div className="flex flex-col text-center w-full">
                        <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Ticket Booked Successfully!</h1>
                        <p className="lg:w-2/3 mx-auto leading-relaxed text-base">Thank you for supporting our service, I hope you had a wonderful experience.</p>
                    </div>
                    <div className="container">
                        <p className="lg:w-2/3 mx-auto leading-relaxed text-base">You don't need to print this out, you can just show this ticket from your device before boarding the bus.</p>
                        <div className="cardWrap">
                            <TicketLeaf donHang={donHang} />
                        </div>
                        <div className="flex justify-center mt-5">
                            <a className='mr-2' href='/'>Back to Home</a> | <a className='ml-2' href='/users/ordershistory'>View Bookings History</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
}