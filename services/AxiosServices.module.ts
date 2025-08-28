import axios from 'axios';

// Simple AxiosPost utility for local API
export async function AxiosPost({ path, payload }: { path: string; payload: any }) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const url = baseUrl + path;
  const response = await axios.post(url, payload);
  return response.data;
}

export default AxiosPost;
