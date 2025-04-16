export const formatSuccessResponse = (data: any, message: string = 'Success') => {
    return {
        status: 'success',
        message,
        data,
    };
};

export const formatErrorResponse = (error: string, message: string) => {
    return {
        status: 'error',
        error,
        message,
    };
};