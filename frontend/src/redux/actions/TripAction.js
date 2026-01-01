import { notification } from "antd";
import { GET_TRIP_DETAIL, GET_TRIP_LIST } from "../constants";
import { history } from "../../App";
import { tripService } from "../../services/TripService";
import { displayLoadingAction, hideLoadingAction } from "./LoadingAction";

export const getTripListAction = () => {
  return async (dispatch) => {
    try {
      const result = await tripService.getTripList();
      if (result.data.status === 200) {
        dispatch({
          type: GET_TRIP_LIST,
          arrTrip: result.data.data,
        });
      }
    } catch (error) {
      console.log("error", error);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Failed to load trips.</>,
      });
    }
  };
};

export const getTripListByDriverId = (Id) => {
  return async (dispatch) => {
    try {
      const result = await tripService.getTripByDriverId(Id);
      if (result.data.status === 200) {
        dispatch({
          type: GET_TRIP_LIST,
          arrTrip: result.data.data,
        });
      }
    } catch (error) {
      console.log("error", error);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Failed to load driver trips.</>,
      });
    }
  };
};

export const getTripByIdAction = (id) => {
  return async (dispatch) => {
    try {
      const result = await tripService.getTripById(id);
      if (result.data.status === 200) {
        dispatch({
          type: GET_TRIP_DETAIL,
          tripDetail: result.data.data[0],
        });
      }
    } catch (error) {
      console.log("error", error);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Failed to load trip details.</>,
      });
    }
  };
};

export const addNewTripAction = (formData) => {
  return async (dispatch) => {
    try {
      dispatch(displayLoadingAction);
      const result = await tripService.addNewTrip(formData);
      
      if (result.data.status === 200 || result.data.status === 201) {
        notification.success({
          closeIcon: true,
          message: "Success",
          description: <>Added successfully.</>,
        });
        await dispatch(hideLoadingAction);
        history.push("/admin/tripmng");
      }
    } catch (error) {
      await dispatch(hideLoadingAction);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Duplicate driver or bus within the selected time range.</>,
      });
      console.log("error", error);
    }
  };
};

export const updateTripAction = (id, formData) => {
  return async (dispatch) => {
    try {
      dispatch(displayLoadingAction);
      
  
      console.log('Update Trip - ID:', id);
      console.log('Update Trip - FormData/Payload:', formData);
      
      const result = await tripService.updateTrip(id, formData);
      
      if (result.data.status === 200) {
        notification.success({
          closeIcon: true,
          message: 'Success',
          description: <>Updated successfully</>,
        });
        await dispatch(hideLoadingAction);
        history.push('/admin/tripmng');
      }
    } catch (error) {
      await dispatch(hideLoadingAction);
      console.log('Update trip error:', error);
      console.log('Error response:', error.response?.data);
      notification.error({
        closeIcon: true,
        message: 'Error',
        description: <>Failed to update trip. Please try again.</>,
      });
    }
  };
};

export const deleteTripAction = (id) => {
  return async (dispatch) => {
    try {
      dispatch(displayLoadingAction);
      const result = await tripService.deleteTrip(id);
      
      if (result.data.status === 200) {
        notification.success({
          closeIcon: true,
          message: "Success",
          description: <>Deleted successfully</>,
        });
        await dispatch(hideLoadingAction);
   
        dispatch(getTripListAction());
      } else {
        await dispatch(hideLoadingAction);
        notification.error({
          closeIcon: true,
          message: "Error",
          description: <>Cannot delete trip</>,
        });
      }
    } catch (error) {
      await dispatch(hideLoadingAction);
      console.log("error", error);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Cannot delete trip. It may be in use.</>,
      });
    }
  };
};

export const getTripListOptionsAction = (options) => {
  return async (dispatch) => {
    try {
      dispatch(displayLoadingAction);
      const result = await tripService.getTripListOptions(options);
      
      if (result.data.status === 200) {
        dispatch({
          type: GET_TRIP_LIST,
          arrTrip: result.data.data,
        });
        await dispatch(hideLoadingAction);
      }
    } catch (error) {
      await dispatch(hideLoadingAction);
      console.log("error", error);
      notification.error({
        closeIcon: true,
        message: "Error",
        description: <>Failed to load trip options.</>,
      });
    }
  };
};