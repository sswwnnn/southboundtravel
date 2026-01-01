import { GET_NEWS_LIST, GET_NEWS_DETAIL } from "../constants";

const initialState = {
    arrNews: [],
    arrNewsChunked: [], 
}

export const NewReducer = (state = initialState, action) => {
    switch (action.type) {

        case GET_NEWS_LIST:
            return { 
                ...state,
                arrNews: action.arrNews, 
                arrNewsChunked: action.arrNewsChunked 
            }
        case GET_NEWS_DETAIL:
            return {
                ...state,
                newsDetail: action.newsDetail
            }
        
        default:
            return { ...state }
    }
}