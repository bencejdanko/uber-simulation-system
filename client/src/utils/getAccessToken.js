export function getAccessToken() {
    const accessToken = localStorage.getItem('customerToken');
    return accessToken;
}
