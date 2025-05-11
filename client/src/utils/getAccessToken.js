export function getAccessToken() {
    const accessToken = localStorage.getItem('accessToken');
    return accessToken;
}
