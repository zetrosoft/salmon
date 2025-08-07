import axios from 'axios'; // axios is imported to simulate a real API, but not used in this mock.

// Simulate API latency
const simulateLatency = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  salesName?: string;
}

export const mockLogin = async (username: string, password: string): Promise<LoginResponse> => {
  await simulateLatency(500);
  console.log(axios); // Dummy usage to prevent TS6133 error
  if (username === 'sales' && password === 'password') {
    return { success: true, token: 'mock-token-123', salesName: 'Sales User' };
  } else {
    return { success: false, message: 'Invalid credentials' };
  }
};

interface VisitPlan {
  name: string;
  store_name: string;
  address: string;
  status: 'Terjadwal' | 'Check-in' | 'Selesai';
  checkin_time?: string;
  checkout_time?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string | null;
}

let mockVisitPlans: VisitPlan[] = [
  { name: 'SVP0001', store_name: 'Toko ABC', address: 'Jl. Contoh No. 1', status: 'Terjadwal' },
  { name: 'SVP0002', store_name: 'Warung Jaya', address: 'Jl. Contoh No. 2', status: 'Terjadwal' },
  { name: 'SVP0003', store_name: 'Minimarket Sejahtera', address: 'Jl. Contoh No. 3', status: 'Check-in', checkin_time: '10:00' },
  { name: 'SVP0004', store_name: 'Grosir Makmur', address: 'Jl. Contoh No. 4', status: 'Selesai', checkin_time: '09:00', checkout_time: '09:30' },
];

export const getVisitPlans = async (_salesName: string): Promise<VisitPlan[]> => {
  await simulateLatency(700);
  // In a real app, this would filter by salesName and current date
  return mockVisitPlans.filter(plan => plan.status !== 'Selesai'); // Only show active plans for simplicity
};

export const updateVisitPlanStatus = async (name: string, newStatus: 'Check-in' | 'Selesai', data?: { latitude?: number, longitude?: number, photo_url?: string }): Promise<boolean> => {
  await simulateLatency(300);
  const index = mockVisitPlans.findIndex(plan => plan.name === name);
  if (index !== -1) {
    const updatedPlan = { ...mockVisitPlans[index], status: newStatus };
    if (newStatus === 'Check-in') {
      updatedPlan.checkin_time = new Date().toLocaleTimeString();
    } else if (newStatus === 'Selesai') {
      updatedPlan.checkout_time = new Date().toLocaleTimeString();
      if (data) {
        updatedPlan.latitude = data.latitude;
        updatedPlan.longitude = data.longitude;
        updatedPlan.photo_url = data.photo_url;
      }
    }
    mockVisitPlans[index] = updatedPlan;
    return true;
  }
  return false;
};

export const getOrderHistory = async (_storeName: string): Promise<any[]> => {
  await simulateLatency(500);
  // Mock data for order history
  return [
    { orderId: 'ORD001', date: '2025-07-01', amount: 150000, items: ['Item A', 'Item B'] },
    { orderId: 'ORD002', date: '2025-06-15', amount: 200000, items: ['Item C', 'Item D'] },
  ];
};