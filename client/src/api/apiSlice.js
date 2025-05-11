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
  tagTypes: ['Customer', 'Driver', 'Ride', 'Bill', 'Auth'],
  endpoints: (builder) => ({
    // Customer Endpoints
    getCustomerById: builder.query({ query: (id) => `/customers/${id}` }),
    listCustomers: builder.query({ query: () => '/customers' }),
    searchCustomers: builder.query({ query: (params) => ({ url: '/customers/search', params }) }),
    createCustomer: builder.mutation({ query: (data) => ({ url: '/customers', method: 'POST', body: data }) }),
    updateCustomer: builder.mutation({ query: ({ id, ...data }) => ({ url: `/customers/${id}`, method: 'PATCH', body: data }) }),
    deleteCustomer: builder.mutation({ query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }) }),

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
    getRidesByCustomer: builder.query({ query: (customer_id) => `/rides?customer_id=${customer_id}` }),
    getRidesByDriver: builder.query({ query: (driver_id) => `/rides?driver_id=${driver_id}` }),
    searchRides: builder.query({ query: (params) => ({ url: '/rides/search', params }) }),
    cancelRide: builder.mutation({ query: (id) => ({ url: `/rides/${id}`, method: 'DELETE' }) }),

    // Billing Endpoints
    createBill: builder.mutation({ query: (data) => ({ url: '/bills', method: 'POST', body: data }) }),
    getBillById: builder.query({ query: (id) => `/bills/${id}` }),
    getBillsByCustomer: builder.query({ query: (customer_id) => `/bills?customer_id=${customer_id}` }),
    getBillsByDriver: builder.query({ query: (driver_id) => `/bills?driver_id=${driver_id}` }),
    listBills: builder.query({ query: (params) => ({ url: '/bills', params }) }),
    deleteBill: builder.mutation({ query: (id) => ({ url: `/bills/${id}`, method: 'DELETE' }) }),

    // Auth Endpoints (using relative paths now)
    loginCustomer: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/customer',
        method: 'POST',
        body: credentials,
      }),
    }),
    loginDriver: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/driver',
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

  // Billing
  useCreateBillMutation,
  useGetBillByIdQuery,
  useGetBillsByCustomerQuery,
  useGetBillsByDriverQuery,
  useListBillsQuery,
  useDeleteBillMutation,

  // Auth Hooks
  useLoginDriverMutation,
  useRegisterDriverMutation,
} = apiSlice;