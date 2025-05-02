import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    // Example endpoint: get customer by ID
    getCustomerById: builder.query({
      query: (id) => `/customers/${id}`,
    }),
    // Add more endpoints as needed
  }),
});

export const { useGetCustomerByIdQuery } = apiSlice;
