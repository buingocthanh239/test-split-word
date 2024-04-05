import Axios from 'axios';

export async function upLoadImage(image) {
    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', 'n1cxgw6j')
    const res = await Axios.post('https://api.cloudinary.com/v1_1/dgze4uhgg/image/upload', formData)
    return res?.data?.url
}