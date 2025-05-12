import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from '../utils/getAccessToken';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/v1', // Base URL for all relative paths
    prepareHeaders: (headers, { getState }) => {
      const token = getAccessToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Customer', 'Driver', 'Ride', 'Bill', 'Auth'], // Ensure 'Customer' tag type is listed
  endpoints: (builder) => ({
    // Customer Endpoints
    getCustomerById: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }], // Provide a specific tag for this customer
    }),
    listCustomers: builder.query({
      query: () => '/customers',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Customer', id })), { type: 'Customer', id: 'LIST' }]
          : [{ type: 'Customer', id: 'LIST' }],
    }),
    searchCustomers: builder.query({ query: (params) => ({ url: '/customers/search', params }) }),
    createCustomer: builder.mutation({
      query: (data) => ({ url: '/customers', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }], // Invalidate the list of customers
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }], // Invalidate the specific customer's data
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }], // Invalidate specific customer and list
    }),

    // Driver Endpoints
    getDriverById: builder.query({ query: (id) => `/drivers/${id}` }),
    listDrivers: builder.query({ query: () => '/drivers' }),
    searchDrivers: builder.query({ query: (params) => ({ url: '/drivers/search', params }) }),
    createDriver: builder.mutation({ query: (data) => ({ url: '/drivers', method: 'POST', body: data }) }),
    updateDriver: builder.mutation({ query: ({ id, ...data }) => ({ url: `/drivers/${id}`, method: 'PATCH', body: data }) }),
    deleteDriver: builder.mutation({ query: (id) => ({ url: `/drivers/${id}`, method: 'DELETE' }) }),
    updateDriverLocation: builder.mutation({ query: ({ id, ...data }) => ({ url: `/drivers/${id}/location`, method: 'PATCH', body: data }) }),
    getNearbyDrivers: builder.query({ query: (params) => ({ url: '/drivers/nearby', params }) }),
    updateDriverProfile: builder.mutation({
      query: ({ driverId, data }) => ({
        url: `/drivers/${driverId}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    // Rides Endpoints
    requestRide: builder.mutation({ query: (data) => ({ url: '/rides', method: 'POST', body: data }) }),
    getRideById: builder.query({ query: (id) => `/rides/${id}` }),
    listRides: builder.query({ query: (params) => ({ url: '/rides', params }) }),
    // getRidesByCustomer: builder.query({ query: (customer_id) => `/rides?customer_id=${customer_id}` }),
    // getRidesByDriver: builder.query({ query: (driver_id) => `/rides?driver_id=${driver_id}` }),
    searchRides: builder.query({ 
      query: (params) => ({ url: '/rides/search', params }),
      providesTags: (result, error, arg) =>
        result?.rides
          ? [
              ...result.rides.map(({ _id }) => ({ type: 'Ride', id: _id })),
              { type: 'Ride', id: 'LIST_REQUESTED' }, // Specific tag for this asearch
            ]
          : [{ type: 'Ride', id: 'LIST_REQUESTED' }],
    }),
    updateRide: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/rides/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Ride', id }, { type: 'Ride', id: 'LIST_REQUESTED' }], // Invalidate the list of requested rides
    }),
    cancelRide: builder.mutation({
      query: (id) => ({ // id is the rideId
        url: `/rides/${id}/cancel`,
        method: 'POST',
        body: {} // Send an empty object as the body, as 'reason' is optional
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Ride', id }, { type: 'Ride', id: 'LIST_REQUESTED' }],
    }),

    // Billing Endpoints
    createBill: builder.mutation({ query: (data) => ({ url: '/bills', method: 'POST', body: data }) }),
    getBillById: builder.query({ query: (id) => `/bills/${id}` }),
    getBillsByCustomer: builder.query({ query: (customer_id) => `/bills?customer_id=${customer_id}` }),
    getBillsByDriver: builder.query({ query: (driver_id) => `/bills?driver_id=${driver_id}` }),
    listBills: builder.query({ query: (params) => ({ url: '/bills', params }) }),
    deleteBill: builder.mutation({ query: (id) => ({ url: `/bills/${id}`, method: 'DELETE' }) }),

    // Pricing Endpoints
    getPricing: builder.query({
      query: (params) => ({ url: '/pricing/actual', params }),
    }),
    getEstimatedFare: builder.query({
      query: ({ pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, requestTime }) => ({
        url: '/pricing/predict',
        params: {
          pickupLatitude: pickupLat,
          pickupLongitude: pickupLng,
          dropoffLatitude: dropoffLat,
          dropoffLongitude: dropoffLng,
          vehicleType,
          ...(requestTime && { requestTime }), // Include requestTime if provided
        },
      }),
    }),
    
    // Auth Endpoints (using relative paths now)
    loginCustomer: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    loginDriver: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    registerDriver: builder.mutation({
      query: (driverData) => ({
        url: '/auth/register/driver',
        method: 'POST',
        body: driverData,
      }),
    }),
    registerCustomer: builder.mutation({
      query: (customerData) => ({
        url: '/auth/register/customer',
        method: 'POST',
        body: customerData,
      }),
    }),
  }),
});

export const {
  // Customer
  useGetCustomerByIdQuery,
  useListCustomersQuery,
  useSearchCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRegisterCustomerMutation,
  useLoginCustomerMutation,

  // Driver
  useGetDriverByIdQuery,
  useListDriversQuery,
  useSearchDriversQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useUpdateDriverLocationMutation,
  useGetNearbyDriversQuery,
  useUpdateDriverProfileMutation,

  // Rides
  useRequestRideMutation,
  useGetRideByIdQuery,
  useListRidesQuery,
  useGetRidesByCustomerQuery,
  useGetRidesByDriverQuery,
  useCancelRideMutation,
  useSearchRidesQuery,
  useUpdateRideMutation,

  // Billing
  useCreateBillMutation,
  useGetBillByIdQuery,
  useGetBillsByCustomerQuery,
  useGetBillsByDriverQuery,
  useListBillsQuery,
  useDeleteBillMutation,

  // Pricing
  useGetPricingQuery,
  useGetEstimatedFareQuery,

  // Auth Hooks
  useLoginDriverMutation,
  useRegisterDriverMutation,
} = apiSlice;