import * as yup from 'yup';

export const createRideSchema = yup.object().shape({
  // customerId is now optional since it will be extracted from JWT headers
  customerId: yup.string(),
  pickupLocation: yup.object().shape({
    latitude: yup.number().required(),
    longitude: yup.number().required()
  }).required(),
  dropoffLocation: yup.object().shape({
    latitude: yup.number().required(),
    longitude: yup.number().required()
  }).required(),
  vehicleType: yup.string().oneOf(['STANDARD', 'PREMIUM', 'LUXURY']).required(),
  paymentMethod: yup.string().oneOf(['CASH', 'CREDIT_CARD', 'PAYPAL']).required(),
});

export const updateRideStatusSchema = yup.object().shape({
  status: yup.string().oneOf(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).required()
});