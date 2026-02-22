import React, { useEffect } from 'react';
import { APP_VERSION } from '../../version';

const UpdateManager = () => {
    useEffect(() => {
        // Only run check in production
        if (import.meta.env.DEV) return;

        const checkForUpdates = async () => {
            try {
                // Fetch the version.json from the server (prevent caching by adding a query param)
                const response = await fetch(`/version.json?t=${new Date().getTime()}`, {
                    cache: 'no-store'
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.version && data.version !== APP_VERSION) {
                        console.log(`New version detected: ${data.version}. Current: ${APP_VERSION}. Forcing reload...`);

                        // Clear caches if supported
                        if ('caches' in window) {
                            const names = await caches.keys();
                            for (let name of names) await caches.delete(name);
                        }

                        // Force hard reload
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.warn('Update check failed:', error);
            }
        };

        // Check immediately on mount
        checkForUpdates();

        // Then check every 5 minutes
        const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
};

export default UpdateManager;
