import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

type NetworkStatus = {
  isConnected: boolean;
};

export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkNetwork = async (): Promise<void> => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? true);
    };

    checkNetwork();
    intervalId = setInterval(checkNetwork, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { isConnected };
}
