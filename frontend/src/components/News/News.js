/* eslint-disable no-lone-blocks */
import { Button, Card, Carousel, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DOMAIN } from "../../util/settings/config";
import { getListNewsAction, detailNewsAction } from "../../redux/actions/NewAction";
import dayjs from "dayjs";
import _ from "lodash";

export default function News(props) {
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Updated to use arrNewsChunked instead of arrNews
    let { arrNewsChunked } = useSelector(state => state.NewReducer);
    let { newsDetail } = useSelector(state => state.NewReducer);
    const { Meta } = Card;

    useEffect(() => {
        dispatch(getListNewsAction())
    }, [dispatch])

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const slickarrowleft = ({ currentslide, slidecount, ...props }) => (
        <button
            {...props}
            classname={
                "slick-prev slick-arrow" +
                (currentslide === 0 ? " slick-disabled" : "")
            }
            aria-hidden="true"
            aria-disabled={currentslide === 0 ? true : false}
            type="button"
        >
            previous
        </button>
    );
    const slickarrowright = ({ currentslide, slidecount, ...props }) => (
        <button
            {...props}
            classname={
                "slick-next slick-arrow" +
                (currentslide === slidecount - 1 ? " slick-disabled" : "")
            }
            aria-hidden="true"
            aria-disabled={currentslide === slidecount - 1 ? true : false}
            type="button"
        >
            next
        </button>
    );

    const settings2 = {
        autoplay: true,
        autoplaySpeed: 10000,
        className: "center",
        draggable: true,
        swipeToSlide: true,
        prevarrow: <slickarrowleft />,
        nextarrow: <slickarrowright />,
    };

    return (
        <div className="mt-4">
            <h1 className="text-center text-2xl">Latest News & Updates</h1>
            <div className="py-4 rounded-xl bg-white" style={{ margin: '0 -15px' }}>
                <Carousel arrows {..._.omit(props, ['currentSlide', 'slideCount'])} draggable={true} {...settings2} style={{ height: 320 }} className="d-block">
                    {arrNewsChunked?.map((newsGroup, groupIndex) => {
                        return (
                            <div key={groupIndex} className="d-flex" >
                                {newsGroup?.map((item, index) => {
                                    return (
                                        <div key={index} className="justify-center col-2">
                                            <Card hoverable onClick={() => {
                                                dispatch(detailNewsAction(item.id))
                                                showModal()
                                            }}
                                                cover={<img alt="example" style={{ height: 160, objectFit: 'cover' }} src={`${DOMAIN}/Images/News/${item.image}`} />} >
                                                <Meta style={{ height: 60}} className="text-sm" title={item.title} />
                                            </Card>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </Carousel>
            </div>
            <Modal 
                title={newsDetail?.title} 
                open={isModalOpen} 
                maskClosable={true} 
                footer={null} 
                width={800} 
                onOk={handleOk} 
                onCancel={handleCancel}
            >
                <div className="row">
                    <div className="col-12">
                        <img 
                            src={`${DOMAIN}/Images/News/${newsDetail?.image}`} 
                            className="w-100 object-fit-cover border mb-3" 
                            style={{ maxHeight: '400px', borderRadius: '10px' }} 
                            alt={newsDetail?.title} 
                        />
                        <div className="text-xs text-gray-500 mb-3">
                            Published on {dayjs(newsDetail?.publishDate).format("MMMM DD, YYYY")}
                        </div>
                        <div 
                            className="news-content" 
                            style={{ lineHeight: '1.8', textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: newsDetail?.content }}
                        />
                        {newsDetail?.author && (
                            <div className="text-sm text-gray-600 mt-4 italic">
                                - {newsDetail?.author}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    )
}