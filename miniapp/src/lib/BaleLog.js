const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.LOG_CHAT_ID;

async function sendBaleMessage(message) {
    try {
        const url = `https://tapi.bale.ai/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send Bale message');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending Bale message:', error);
        return null;
    }
}

module.exports = {
    sendBaleMessage
};

