import { useState, useEffect } from 'react';

function useUser() {
    const [userData, setUserData] = useState(null);
    const [themeParams, setThemeParams] = useState(null); // Optional: if you also need themeParams

    useEffect(() => {
        const waitForBaleSDK = () => {
            return new Promise((resolve) => {
                const checkSDK = () => {
                    if (typeof window !== 'undefined' && window.Bale?.WebApp) {
                        resolve();
                    } else {
                        setTimeout(checkSDK, 100);
                    }
                };
                checkSDK();
            });
        };

        waitForBaleSDK().then(() => {
            const user = window.Bale.WebApp.initDataUnsafe?.user;
            setUserData(user);
            console.log(user);
            const webAppTheme = window.Bale.WebApp.themeParams;
            if (webAppTheme) {
                setThemeParams(webAppTheme);
            }
        });
    }, []);

    return [userData, themeParams]; // You can also return an object if preferred
}

export default useUser;
