import * as yup from 'yup';

export const createRideSchema = yup.object().shape({
  pickupLocation: yup.object().shape({
    latitude: yup.number().required(),
    longitude: yup.number().required()
  }).required(),
  dropoffLocation: yup.object().shape({
    latitude: yup.number().required(),
    longitude: yup.number().required()
  }).required(),
  customerId: yup.string().required()
});

export const updateRideStatusSchema = yup.object().shape({
  status: yup.string().oneOf(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).required()
}); 