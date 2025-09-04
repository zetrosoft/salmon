import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';


let api: AxiosInstance;

// Define interfaces for the data structures
interface OrderHistory {
  name: string;
  posting_date: string;
  grand_total: number;
  status: string;
}

interface SalesActivity {
  Date: string;
  Customer: string;
  Checkin: string;
  Checkout: string;
  Duration: number;
  Status: string;
}

interface DashboardData {
  total_visits_today: number;
  pending_visits: number;
  completed_visits_today: number;
  total_sales_month?: number;
  total_outstanding_sales?: number;
  achievement_percentage: number;
}

interface WeeklyVisitSalesComparisonData {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

interface WeeklyCustomerOrderData {
  week: string;
  [customer: string]: number | string;
}

interface Customer {
  name: string;
}

interface SalesVisitPlanData {
  sales_person: string;
  planned_visit_date: string;
  visit_plan_details: {
    idx: number;
    customer: string;
    address: string;
    visit_time: string;
    notes: string;
  }[];
}

interface CreateSalesVisitPlanResponse {
  name: string;
  status: string;
  message?: string;
}


export const initializeApi = async () => {
  try {
    const response = await fetch('/setup.json');
    //console.log(response)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    const API_BASE_URL = config.API_BASE_URL;

    api = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
    });
    //console.log(API_BASE_URL);
  } catch (error) {
    console.error("Could not load setup.json. Using default API URL.", error);
    api = axios.create({
        baseURL: 'https://erp.samkarsa.com', // Fallback URL
        withCredentials: true,
    });
  }

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
};


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
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
      if (csrfToken) {
        sessionStorage.setItem('frappe_csrf_token', csrfToken.split('=')[1]);
      }
      sessionStorage.setItem('frappe_user_id', responseData.user_id);
      sessionStorage.setItem('frappe_full_name', responseData.full_name);
      return {
        success: true,
        salesName: responseData.employee_id, // Assuming employee_id is the salesName
        userId: responseData.user_id,
      };
    } else {
      return { success: false, message: responseData.message || 'Login failed' };
    }
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Login error:", axiosError.response?.data || axiosError.message);
    return { success: false, message: axiosError.response?.data?.message || 'An unexpected error occurred during login.' };
  }
};

export interface VisitPlan {
  name: string; 
  parent: string;
  store_name: string;
  address: string;
  status: 'Draft' | 'Planned' | 'Checked In' | 'Completed' | 'Canceled';
  parent_docstatus: number; 
  planned_visit_time?: string;
  checkin_time?: string;
  checkout_time?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string | null;
  notes?: string;
}

export const PAGE_LENGTH = 5;
export interface VisitPlansResponse {
  data: VisitPlan[];
  total: number;
}

export const getVisitPlans = async (page: number): Promise<VisitPlansResponse> => { 
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_sales_visit_plans', {
      params: { 
        date: new Date().toISOString().split('T')[0],
        limit_start: page * PAGE_LENGTH,
        limit_page_length: PAGE_LENGTH,
      },
    });
    // Backend returns { data: [], total: 0 }
    const responseData = response.data.message || response.data;
    return responseData.data ? responseData : { data: [], total: 0 };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status >= 400 && error.response.status < 500) {
        console.warn(
          `Client error (${error.response.status}) saat mengambil data visit plans. Mengembalikan objek kosong.`,
          error.response.data
        );
        return { data: [], total: 0 }; 
      }
    }
    console.error("Error fetching visit plans:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch visit plans.');
  }
};

export const submitVisitUpdate = async (name: string, newStatus: 'Checked In' | 'Completed', data?: { latitude?: number, longitude?: number, photo_file?: File | null, checkout_time?: string }): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('new_status', newStatus);

    if (data) {
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      if (data.photo_file) {
        formData.append('photo', data.photo_file); 
      }
      if (data.checkout_time) {
        formData.append('checkout_time', data.checkout_time);
      }
    }
    //console.log(formData);
    const response = await api.post('/api/method/sales_monitor.api.submit_visit_update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const success = response.data.message.status === 'success';
    return success; 
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error submitting visit update:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to submit visit update.');
  }
};

export const getEmployeeId = async (userId: string): Promise<string | null> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_employee_id', {
      params: { user_id: userId },
    });
    return response.data.message || null;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching employee ID:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch employee ID.');
  }
};

export const getOrderHistory = async (storeName: string): Promise<OrderHistory[]> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_order_history', {
      params: { store_name: storeName },
    });
    return response.data.message || response.data.data || [];
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status >= 400 && error.response.status < 500) {
        console.warn(`Client error (${error.response.status}) fetching order history. Returning empty array.`, error.response.data);
        return [];
      }
    }
    console.error("Error fetching order history:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch order history.');
  }
};

export const getSalesActivityHistory = async (fromDate?: string, toDate?: string, customer?: string): Promise<SalesActivity[]> => {
  try {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (customer) params.customer = customer;

    const response = await api.get('/api/method/sales_monitor.api.get_sales_activity_history', { params });
    return response.data.message || response.data.data || [];
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status >= 400 && error.response.status < 500) {
        console.warn(`Client error (${error.response.status}) fetching sales activity history. Returning empty array.`, error.response.data);
        return [];
      }
    }
    console.error("Error fetching sales activity history:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch sales activity history.');
  }
};

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_dashboard_data');
    const dataToReturn = response.data.message || response.data.data;

    if (dataToReturn && dataToReturn.status === 'error') {
      throw new Error(dataToReturn.message || 'Failed to fetch dashboard data.');
    }

    return dataToReturn;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching dashboard data:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch dashboard data.');
  }
};

export const getWeeklyVisitSalesComparisonData = async (): Promise<WeeklyVisitSalesComparisonData> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_weekly_visit_sales_comparison_data');
    return response.data.message || response.data.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching weekly visit sales comparison data:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch weekly visit sales comparison data.');
  }
};

export const getWeeklyCustomerOrderData = async (): Promise<WeeklyCustomerOrderData[]> => {
  try {
    const response = await api.get('/api/method/sales_monitor.api.get_weekly_customer_order_data');
    const data = (response.data.message && response.data.message.data) || response.data.data;
    if (!Array.isArray(data)) {
      console.error("Backend did not return an array for weekly customer order data:", data);
      return [];
    }
    return data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching weekly customer order data:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch weekly customer order data.');
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

export const getCustomers = async (searchText: string = '', page: number = 0): Promise<string[]> => {
  const PAGE_LENGTH = 20;
  try {
    const response = await api.get('/api/method/frappe.client.get_list', {
      params: {
        doctype: 'Customer',
        fields: JSON.stringify(['name']),
        filters: searchText ? JSON.stringify([['name', 'like', `%${searchText}%`]]) : JSON.stringify([['name', 'like', '%%']]),
        limit_start: page * PAGE_LENGTH,
        limit_page_length: PAGE_LENGTH,
      },
    });
    return response.data.message.map((d: Customer) => d.name) || [];
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching customers:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch customers.');
  }
};

export const getCustomerAddress = async (customerName: string): Promise<string | null> => {
  try {
    const response = await api.get('/api/method/frappe.client.get_value', {
      params: {
        doctype: 'Customer',
        fieldname: 'primary_address',
        filters: JSON.stringify({ name: customerName }),
      },
    });
    return response.data.message?.primary_address || null;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error fetching customer address:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to fetch customer address.');
  }
};

export const createSalesVisitPlan = async (salesVisitPlanData: SalesVisitPlanData): Promise<CreateSalesVisitPlanResponse> => {
  try {
    const response = await api.post('/api/method/sales_monitor.api.create_sales_visit_plan', {
      sales_visit_plan_data: salesVisitPlanData,
    });
    return response.data.message;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>;
    console.error("Error creating sales visit plan:", axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to create sales visit plan.');
  }
};

export const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    await api.get('/'); 

    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
    if (csrfToken) {
      const token = csrfToken.split('=')[1];
      sessionStorage.setItem('frappe_csrf_token', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
};
