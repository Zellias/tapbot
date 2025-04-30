import { useState, useEffect } from 'react';

function useSdk() {
    const [baleSdk, setBaleSdk] = useState(null);

    useEffect(() => {
        const waitForBaleSDK = () => {
            return new Promise((resolve) => {
                const checkSDK = () => {
                    if (typeof window !== 'undefined' && window.Bale?.WebApp) {
                        resolve(window.Bale.WebApp);
                    } else {
                        setTimeout(checkSDK, 100);
                    }
                };
                checkSDK();
            });
        };

        waitForBaleSDK().then((sdk) => {
            setBaleSdk(sdk);
        });
    }, []);

    return baleSdk; // Return the SDK directly instead of in an array
}

export default useSdk;
