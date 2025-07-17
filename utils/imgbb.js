const axios = require('axios');

async function uploadToImgBB(base64Image, apiKey) {
    const form = new URLSearchParams();
    form.append('image', base64Image);
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form);
    if (response.data && response.data.data && response.data.data.url) {
        return response.data.data.url;
    }
    throw new Error('imgBB upload failed');
}

module.exports = { uploadToImgBB };
