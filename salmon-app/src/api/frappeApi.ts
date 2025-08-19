
import axios from 'axios';

//const API_BASE_URL = 'http://35.219.54.8:8882';
const API_BASE_URL = 'http://localhost:8080'; // Your Frappe instance URL

/*
// --- HARDCODED API KEY & SECRET (FOR DEVELOPMENT ONLY) ---
const HARDCODED_API_KEY = '691dc30ced24013';//'2b7d7c65471aecf';
const HARDCODED_API_SECRET = 'c4c52d2694638d1';// '2fa510cb40c011b';
// ----------------------------------------------------------
*/

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Still needed for initial session login
});

// Remove the Expect header to prevent 417 errors with some servers/proxies
delete api.defaults.headers.common['Expect'];

// Add a request interceptor to include the CSRF token for all state-changing requests
api.interceptors.request.use(config => {
  // Only add CSRF token for non-login POST/PUT/DELETE requests
  if ((config.method === 'post' || config.method === 'put' || config.method === 'delete') &&
      config.url !== '/api/method/sales_monitor.api.pwa_login') {
    const csrfToken = sessionStorage.getItem('frappe_csrf_token'); // Get from sessionStorage
    if (csrfToken) {
      config.headers['X-Frappe-CSRF-Token'] = csrfToken;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

/*
// Add a request interceptor to include the Authorization header for all requests
api.interceptors.request.use(config => {
  // Only add Authorization header if it's not the initial login request
  // and if hardcoded keys are available
  if (config.url !== '/api/method/login' && HARDCODED_API_KEY && HARDCODED_API_SECRET) {
    config.headers.Authorization = `token ${HARDCODED_API_KEY}:${HARDCODED_API_SECRET}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});
*/

interface LoginResponse {
  success: boolean;
  message?: string;
  salesName?: string;
  userId?: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/method/sales_monitor.api.pwa_login', {
      usr: username,
      pwd: password,
    });

    const responseData = response.data.message;

    if (responseData.status === 'success') {
      // Store the SID (which acts as CSRF token) in session storage
      // if (responseData.sid) {
      //     sessionStorage.setItem('frappe_csrf_token', responseData.sid);
      // }

      // After successful login, Frappe sets a `csrf_token` cookie.
      // We need to extract it and store it for subsequent requests.
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
      if (csrfToken) {
        sessionStorage.setItem('frappe_csrf_token', csrfToken.split('=')[1]);
      }
      return {
        success: true,
        salesName: responseData.employee_id, // Assuming employee_id is the salesName
        userId: responseData.user_id,
      };
    } else {
      return { success: false, message: responseData.message || 'Login failed' };
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
  status: 'Draft' | 'Planned' | 'Checked In' | 'Completed' | 'Canceled';
  planned_visit_time?: string;
  checkin_time?: string;
  checkout_time?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string | null;
}

export const getVisitPlans = async (): Promise<VisitPlan[]> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_sales_visit_plans', {
      params: { date: new Date().toISOString().split('T')[0] },
    });
    return response.data.message || response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching visit plans:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch visit plans.');
  }
};

export const submitVisitUpdate = async (name: string, newStatus: 'Checked In' | 'Completed', data?: { latitude?: number, longitude?: number, photo_file?: File | null }): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('new_status', newStatus);

    if (data) {
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      if (data.photo_file) {
        formData.append('photo', data.photo_file); // 'photo' adalah nama input file yang diharapkan backend
      }
    }

    // Kirim FormData sebagai body permintaan POST
    const response = await api.post('/api/method/sales_monitor.api.submit_visit_update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("submitVisitUpdate response:", response.data); // ADDED LOG
    const success = response.data.message.status === 'success'; // FIX APPLIED HERE
    console.log("submitVisitUpdate success boolean:", success); // ADDED LOG
    return success; // Return the boolean
  } catch (error: any) {
    console.error("Error submitting visit update:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to submit visit update.');
  }
};

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
    const response = await api.get('/api/method/sales_monitor.api.get_order_history', {
      params: { store_name: storeName },
    });
    return response.data.message || response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching order history:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch order history.');
  }
};

export const getSalesActivityHistory = async (fromDate?: string, toDate?: string, customer?: string): Promise<any[]> => {
  try {
    const params: any = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (customer) params.customer = customer;

    const response = await api.get('/api/method/sales_monitor.api.get_sales_activity_history', { params });
    return response.data.message || response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching sales activity history:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch sales activity history.');
  }
};

export const getDashboardData = async (): Promise<any> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_dashboard_data');
    return response.data.message || response.data.data;
    console.log(response.data.message)
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data.');
  }
};

export const getWeeklyVisitSalesComparisonData = async (): Promise<any> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_weekly_visit_sales_comparison_data');
    return response.data.message || response.data.data;
  } catch (error: any) {
    console.error("Error fetching weekly visit sales comparison data:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch weekly visit sales comparison data.');
  }
};

export const getWeeklyCustomerOrderData = async (): Promise<any> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_weekly_customer_order_data');
    return response.data.message || response.data.data;
  } catch (error: any) {
    console.error("Error fetching weekly customer order data:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch weekly customer order data.');
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await api.post('/api/method/logout');
    return response.data.message === 'Logged Out';
  } catch (error) {
    console.error("Error logging out:", error);
    return false;
  }
};
