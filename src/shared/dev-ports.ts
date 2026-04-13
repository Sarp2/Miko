export const DEV_CLIENT_PORT = 5174;

export function getDefaultDevServerPort(clientPort = DEV_CLIENT_PORT) {
	return clientPort + 1;
}
