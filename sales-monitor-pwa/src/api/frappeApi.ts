
import axios from 'axios';

//const API_BASE_URL = 'https://localhost:8080'; // Your Frappe instance URL
const API_BASE_URL = 'http://localhost:8080'; // Your Frappe instance URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for handling session cookies
});

// Function to get CSRF token (Frappe often requires this for non-GET requests)
// In a real scenario, you might fetch this from a specific endpoint or a cookie
const getCsrfToken = async (): Promise<string | null> => {
  try {
    // Frappe usually sets a `_csrf_token` cookie or has an endpoint to get it.
    // For simplicity, we'll assume it's handled by `withCredentials` for now
    // or you might need to fetch it from /api/method/frappe.auth.get_csrf_token
    // For now, returning null, and will add a placeholder for it in requests if needed.
    return null; 
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
};

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string; // Frappe doesn't typically return a token for session login
  salesName?: string;
  userId?: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/method/login', {
      usr: username,
      pwd: password,
    });

    if (response.data.message === 'Logged In') {
      // You might need to fetch user details or sales_name after successful login
      // For now, we'll just return success and a dummy salesName
      return { success: true, salesName: username, userId: response.data.user_id }; 
    } else {
      return { success: false, message: response.data.message || 'Login failed' };
    }
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'An unexpected error occurred during login.' };
  }
};

interface VisitPlan {
  name: string; // Frappe DocType name (e.g., 'SVP0001')
  store_name: string;
  address: string;
  status: 'Terjadwal' | 'Check-in' | 'Selesai';
  checkin_time?: string;
  checkout_time?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
}

export const getVisitPlans = async (salesName: string): Promise<VisitPlan[]> => {
  try {
    // Assuming a custom Frappe method to get visit plans for a sales user
    const response = await api.get('/api/method/sales_monitor.api.get_sales_visit_plans', {
      params: { sales_name: salesName, date: new Date().toISOString().split('T')[0] }, // Pass sales_name and current date
    });
    // Frappe API usually returns data in response.data.message or response.data.data
   console.log(response);
    
    return response.data.message || response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching visit plans:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch visit plans.');
  }
};

export const updateVisitPlanStatus = async (name: string, newStatus: 'Check-in' | 'Selesai', data?: { latitude?: number, longitude?: number, photo_url?: string }): Promise<boolean> => {
  try {
    const csrfToken = await getCsrfToken(); // Get CSRF token if needed
    const payload: any = {
      name: name,
      new_status: newStatus,
    };
    if (data) {
      payload.latitude = data.latitude;
      payload.longitude = data.longitude;
      payload.photo_url = data.photo_url;
    }

    // Assuming a custom Frappe method to update visit plan status
    const response = await api.post('/api/method/sales_monitor.api.update_sales_visit_plan_status', payload, {
      headers: {
        'X-Frappe-CSRF-Token': csrfToken || '', // Include CSRF token if available
      },
    });
    return response.data.message === 'Success'; // Adjust based on your Frappe method's return
  } catch (error: any) {
    console.error("Error updating visit plan status:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update visit plan status.');
  }
};

// Placeholder for getting order history
export const getEmployeeId = async (userId: string): Promise<string | null> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_employee_id', {
      params: { user_id: userId },
    });
    return response.data.message || null;
  } catch (error: any) {
    console.error("Error fetching employee ID:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch employee ID.');
  }
};

export const getOrderHistory = async (storeName: string): Promise<any[]> => {
  try {
    // Assuming a custom Frappe method to get order history for a store
    const response = await api.get('/api/method/sales_monitor.api.get_order_history', {
      params: { store_name: storeName },
    });
    return response.data.message || response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching order history:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch order history.');
  }
};
