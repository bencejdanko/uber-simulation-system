import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    // Customer Endpoints
    getCustomerById: builder.query({ query: (id) => `/customers/${id}` }),
    createCustomer: builder.mutation({ query: (data) => ({ url: '/customers', method: 'POST', body: data }) }),
    updateCustomer: builder.mutation({ query: ({ id, ...data }) => ({ url: `/customers/${id}`, method: 'PATCH', body: data }) }),
    deleteCustomer: builder.mutation({ query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }) }),

    // Driver Endpoints
    getDriverById: builder.query({ query: (id) => `/drivers/${id}` }),
    createDriver: builder.mutation({ query: (data) => ({ url: '/drivers', method: 'POST', body: data }) }),
    updateDriver: builder.mutation({ query: ({ id, ...data }) => ({ url: `/drivers/${id}`, method: 'PATCH', body: data }) }),
    deleteDriver: builder.mutation({ query: (id) => ({ url: `/drivers/${id}`, method: 'DELETE' }) }),
    getNearbyDrivers: builder.query({ query: (params) => ({ url: '/drivers/nearby', params }) }),

    // Rides Endpoints
    requestRide: builder.mutation({ query: (data) => ({ url: '/rides', method: 'POST', body: data }) }),
    getRideById: builder.query({ query: (id) => `/rides/${id}` }),
    getRidesByCustomer: builder.query({ query: (customer_id) => `/rides?customer_id=${customer_id}` }),
    getRidesByDriver: builder.query({ query: (driver_id) => `/rides?driver_id=${driver_id}` }),
    cancelRide: builder.mutation({ query: (id) => ({ url: `/rides/${id}`, method: 'DELETE' }) }),

    // Billing Endpoints
    createBill: builder.mutation({ query: (data) => ({ url: '/bills', method: 'POST', body: data }) }),
    getBillById: builder.query({ query: (id) => `/bills/${id}` }),
    getBillsByCustomer: builder.query({ query: (customer_id) => `/bills?customer_id=${customer_id}` }),
    deleteBill: builder.mutation({ query: (id) => ({ url: `/bills/${id}`, method: 'DELETE' }) }),
  }),
});

export const {
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetDriverByIdQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useGetNearbyDriversQuery,
  useRequestRideMutation,
  useGetRideByIdQuery,
  useGetRidesByCustomerQuery,
  useGetRidesByDriverQuery,
  useCancelRideMutation,
  useCreateBillMutation,
  useGetBillByIdQuery,
  useGetBillsByCustomerQuery,
  useDeleteBillMutation,
} = apiSlice;
