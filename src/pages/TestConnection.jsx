
import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';

const TestConnection = () => {
    const [status, setStatus] = useState('Testing...');
    const [logs, setLogs] = useState([]);
    const [envInfo, setEnvInfo] = useState({});

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    useEffect(() => {
        const runTest = async () => {
            // 1. Check Env Vars
            const envs = {
                ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
                PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
                DATABASE_ID: DATABASE_ID,
                COLLECTION_PRODUCTS: COLLECTIONS.PRODUCTS
            };
            setEnvInfo(envs);
            addLog(`Environment: ${JSON.stringify(envs, null, 2)}`);

            // 2. Test Connection
            try {
                addLog('Attempting to fetch products (limit 1)...');
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.PRODUCTS,
                    [Query.limit(1)]
                );
                addLog(`Success! Found ${response.total} products.`);
                addLog(`First product ID: ${response.documents[0]?.$id}`);
                setStatus('SUCCESS');
            } catch (error) {
                console.error(error);
                addLog(`ERROR: ${error.message}`, 'error');
                if (error.code) addLog(`Error Code: ${error.code}`, 'error');
                if (error.response) addLog(`Response: ${JSON.stringify(error.response)}`, 'error');
                setStatus('FAILED');
            }
        };

        runTest();
    }, []);

    return (
        <div style={{ padding: '2rem', background: '#121212', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
            <h1>System Diagnostics</h1>
            <div style={{ padding: '1rem', border: `1px solid ${status === 'SUCCESS' ? 'green' : 'red'}`, marginBottom: '1rem' }}>
                Status: <strong>{status}</strong>
            </div>

            <h3>Environment Config</h3>
            <pre style={{ background: '#222', padding: '1rem' }}>
                {JSON.stringify(envInfo, null, 2)}
            </pre>

            <h3>Logs</h3>
            <div style={{ background: '#222', padding: '1rem' }}>
                {logs.map((log, i) => (
                    <div key={i} style={{ color: log.type === 'error' ? 'red' : '#0f0', marginBottom: '0.5rem' }}>
                        [{log.time}] {log.msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestConnection;
