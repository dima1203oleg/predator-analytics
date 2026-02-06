import React from 'react';

const AppLight = () => {
    return (
        <div style={{ padding: '50px', backgroundColor: '#000', color: '#fff', height: '100vh' }}>
            <h1>🦁 PREDATOR SYSTEM</h1>
            <p>Status: <span style={{ color: '#0f0' }}>EMERGENCY CORE ACTIVE</span></p>
            <hr />
            <div style={{ marginTop: '20px' }}>
                <h3>Monitoring Targets:</h3>
                <ul>
                    <li>Customs_of_Ukraine (t.me/Customs_of_Ukraine)</li>
                </ul>
            </div>
            <div style={{ padding: '20px', border: '1px red solid', marginTop: '50px' }}>
                SYSTEM IS UNDER FILE PERMISSION LOCK. <br/>
                Please move project to /Users/dima-mac/ (Home Folder) to unlock full UI.
            </div>
        </div>
    );
};

export default AppLight;
