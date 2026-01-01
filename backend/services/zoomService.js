const axios = require('axios');
const logger = require('../utils/logger');

// Zoom API configuration
const ZOOM_API_URL = 'https://api.zoom.us/v2';
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

// In-memory token cache (simple)
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

async function getZoomAccessToken() {
    if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    try {
        const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

        const response = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'account_credentials',
                account_id: ZOOM_ACCOUNT_ID
            },
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        tokenCache.accessToken = response.data.access_token;
        // Set expiration 5 minutes before actual expiry to be safe
        tokenCache.expiresAt = Date.now() + (response.data.expires_in * 1000) - 300000;

        return tokenCache.accessToken;

    } catch (error) {
        logger.error('Error getting Zoom access token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Zoom');
    }
}

async function createMeeting(consultaId, topic, patientName) {
    // Mock mode for development
    if (process.env.NODE_ENV === 'development' || process.env.MOCK_ZOOM === 'true') {
        logger.info('MOCK ZOOM: Creating meeting', { consultaId, topic });
        const mockId = Math.floor(Math.random() * 10000000000).toString();
        return {
            id: mockId,
            topic: topic,
            join_url: `https://zoom.us/j/${mockId}?pwd=mocked`,
            start_url: `https://zoom.us/s/${mockId}?pwd=mocked`,
            password: 'mocked_password',
            settings: {
                join_before_host: true,
                waiting_room: false
            }
        };
    }

    // Real implementation
    try {
        const token = await getZoomAccessToken();

        const meetingData = {
            topic: topic,
            type: 2, // Scheduled meeting
            start_time: new Date().toISOString(),
            duration: 60,
            settings: {
                join_before_host: true,
                waiting_room: false,
                meeting_authentication: false,
                auto_recording: 'none'
            }
        };

        const response = await axios.post(`${ZOOM_API_URL}/users/me/meetings`, meetingData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;

    } catch (error) {
        logger.error('Error creating Zoom meeting:', error.response?.data || error.message);
        throw new Error('Failed to create Zoom meeting');
    }
}

async function deleteMeeting(meetingId) {
    if (process.env.NODE_ENV === 'development' || process.env.MOCK_ZOOM === 'true') {
        logger.info('MOCK ZOOM: Deleting meeting', { meetingId });
        return true;
    }

    try {
        const token = await getZoomAccessToken();
        await axios.delete(`${ZOOM_API_URL}/meetings/${meetingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return true;
    } catch (error) {
        logger.warn('Failed to delete meeting from Zoom:', error.message);
        return false;
    }
}

module.exports = {
    createMeeting,
    deleteMeeting
};
