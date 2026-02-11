// src/pages/VisitSchedulePage.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VisitSchedulePage from './VisitSchedulePage';
import { BrowserRouter } from 'react-router-dom';

// Import modules to be mocked
import * as locationUtils from '../utils/locationUtils';
import * as frappeApi from '../api/frappeApi'; // Import frappeApi to be mocked

// MOCK FRAPPEAPI
// This will define the mocked module's exports directly.
// We'll use vi.fn() instances for each function.
vi.mock('../api/frappeApi', () => ({
  getVisitPlans: vi.fn(),
  submitVisitUpdate: vi.fn(),
  getCustomerMasterLocation: vi.fn(),
  updateCustomerLocation: vi.fn(),
}));

// MOCK REACT-ROUTER-DOM
// Only mock what's used, to avoid issues with spreading 'actual'
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useOutletContext: () => ({ employeeId: 'EMP001' }),
  BrowserRouter: BrowserRouter, // Add BrowserRouter back if it's used directly
}));


// MOCK NAVIGATOR.GEOLOCATION
const mockGeolocation = {
  getCurrentPosition: vi.fn((successCallback) => {
    successCallback({
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    geolocation: mockGeolocation,
  },
  writable: true,
});

// MOCK LOCATIONUTILS
vi.mock('../utils/locationUtils', () => ({
  getDistanceInMeters: vi.fn(),
  formatDistance: (meters: number) => {
    if (meters < 500) {
      return `${Math.round(meters)} meter`;
    } else {
      const kilometers = meters / 1000;
      return `${kilometers.toFixed(1)} km`;
    }
    },
}));


describe('VisitSchedulePage', () => {
  // Use vi.mocked to get a typed reference to the mocked module's functions
  const mockedFrappeApi = vi.mocked(frappeApi); // Get the mocked module
  const mockedLocationUtils = vi.mocked(locationUtils); // Get the mocked module

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations using the mockedFrappeApi reference
    mockedFrappeApi.getVisitPlans.mockResolvedValue({ data: [], total: 0 });
    mockedFrappeApi.getCustomerMasterLocation.mockResolvedValue(null);
    mockedLocationUtils.getDistanceInMeters.mockReturnValue(10);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <VisitSchedulePage />
      </BrowserRouter>
    );

  it('renders "My Visit Schedule" title', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/My Visit Schedule/i)).toBeInTheDocument();
    });
  });

  // Test Case 1: Customer group is 'Mobile', should bypass distance check
  it('should bypass distance check for "Mobile" customer group', async () => {
    mockedFrappeApi.getVisitPlans.mockResolvedValueOnce({
      data: [{
        name: 'VP001',
        store_name: 'Mobile Customer A',
        address: '123 Mobile St',
        status: 'Checked In',
        parent_docstatus: 1,
        customer_group: 'Mobile', // Key for this test
        planned_visit_time: '01-01-2026 10:00', // Needed for isToday check
      } as any], // Cast to any to bypass type check for tests
      total: 1
    });

    mockedFrappeApi.getCustomerMasterLocation.mockResolvedValueOnce({
      latitude: -6.2089,
      longitude: 106.8457,
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Mobile Customer A')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Check Out/i }));
    await waitFor(() => expect(screen.getByText(/Mempersiapkan checkout.../i)).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeInTheDocument();
    });
    expect(mockedLocationUtils.getDistanceInMeters).not.toHaveBeenCalled();
    expect(screen.queryByText('Lokasi Terlalu Jauh')).not.toBeInTheDocument();
  });

  // Test Case 2: Customer group is NOT 'Mobile' and distance is too far
  it('should show "Lokasi Terlalu Jauh" dialog if distance is too far for non-mobile customer', async () => {
    mockedFrappeApi.getVisitPlans.mockResolvedValueOnce({
      data: [{
        name: 'VP002',
        store_name: 'Regular Customer B',
        address: '456 Regular Ave',
        status: 'Checked In',
        parent_docstatus: 1,
        customer_group: 'Retail', // Not 'Mobile'
        planned_visit_time: '01-01-2026 10:00', // Needed for isToday check
      } as any], // Cast to any to bypass type check for tests
      total: 1
    });

    mockedFrappeApi.getCustomerMasterLocation.mockResolvedValueOnce({
      latitude: -6.2000, // Master location far away
      longitude: 106.8000,
    });

    mockedLocationUtils.getDistanceInMeters.mockReturnValue(150);

    renderComponent();

    // Find the card heading for the customer
    const customerCardHeading = await screen.findByRole('heading', { name: 'Regular Customer B' });
    expect(customerCardHeading).toBeInTheDocument();

    // Click Check Out button associated with that card
    const customerCard = customerCardHeading.closest('.MuiCard-root');
    expect(customerCard).toBeInTheDocument();
    if (!customerCard) throw new Error('Customer card not found'); // Explicit null check
    const customerHtmlElement = customerCard as HTMLElement; // Cast to HTMLElement
    
    const checkOutButton = await within(customerHtmlElement).findByRole('button', { name: /Check Out/i });
    fireEvent.click(checkOutButton);


    await waitFor(() => expect(screen.getByText(/Mempersiapkan checkout.../i)).toBeInTheDocument());

    // Get the dialog element
    const dialog = await screen.findByRole('dialog', { name: /Lokasi Terlalu Jauh/i });
    expect(dialog).toBeInTheDocument();

    // Now, assert text *within* the dialog
    await waitFor(() => {
      expect(within(dialog).getByText(/Lokasi Anda terlalu jauh/i)).toBeInTheDocument();
      expect(within(dialog).getByText('Regular Customer B')).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Checkout')).not.toBeInTheDocument();
    expect(mockedLocationUtils.getDistanceInMeters).toHaveBeenCalled();
  });

  // Test Case 3: Customer group is NOT 'Mobile' and distance is "almost there" (50m < distance < 100m)
  it('should show "Lokasi Terlalu Jauh" dialog with "almost there" message if distance is between 50m and 100m for non-mobile customer', async () => {
    mockedFrappeApi.getVisitPlans.mockResolvedValueOnce({
      data: [{
        name: 'VP003',
        store_name: 'Almost There Customer C',
        address: '789 Near St',
        status: 'Checked In',
        parent_docstatus: 1,
        customer_group: 'Wholesale', // Not 'Mobile'
        planned_visit_time: '01-01-2026 10:00', // Needed for isToday check
      } as any], // Cast to any to bypass type check for tests
      total: 1
    });

    mockedFrappeApi.getCustomerMasterLocation.mockResolvedValueOnce({
      latitude: -6.20885, // Master location slightly off
      longitude: 106.84565,
    });

    mockedLocationUtils.getDistanceInMeters.mockReturnValue(75);

    renderComponent();

    await waitFor(() => expect(screen.getByText('Almost There Customer C')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Check Out/i }));
    await waitFor(() => expect(screen.getByText(/Mempersiapkan checkout.../i)).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Lokasi Terlalu Jauh/i })).toBeInTheDocument();
      expect(screen.getByText(/Terus melangkah lagi lokasi anda sudah dekat./i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Checkout')).not.toBeInTheDocument();
    expect(mockedLocationUtils.getDistanceInMeters).toHaveBeenCalled();
  });

  // Test Case 4: Customer group is NOT 'Mobile' and distance is close (< 50m)
  it('should open checkout dialog directly if distance is close for non-mobile customer', async () => {
    mockedFrappeApi.getVisitPlans.mockResolvedValueOnce({
      data: [{
        name: 'VP004',
        store_name: 'Close Customer D',
        address: '101 Close Rd',
        status: 'Checked In',
        parent_docstatus: 1,
        customer_group: 'Direct', // Not 'Mobile'
        planned_visit_time: '01-01-2026 10:00', // Needed for isToday check
      } as any], // Cast to any to bypass type check for tests
      total: 1
    });

    mockedFrappeApi.getCustomerMasterLocation.mockResolvedValueOnce({
      latitude: -6.2088,
      longitude: 106.8456,
    });

    mockedLocationUtils.getDistanceInMeters.mockReturnValue(20);

    renderComponent();

    await waitFor(() => expect(screen.getByText('Close Customer D')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Check Out/i }));
    await waitFor(() => expect(screen.getByText(/Mempersiapkan checkout.../i)).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeInTheDocument();
    });
    expect(screen.queryByText('Lokasi Terlalu Jauh')).not.toBeInTheDocument();
    expect(mockedLocationUtils.getDistanceInMeters).toHaveBeenCalled();
  });
});