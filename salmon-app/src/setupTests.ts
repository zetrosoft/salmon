// src/setupTests.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock MediaStream
// Only define the properties and methods actually used by the component
class MockMediaStream {
  id: string = 'mock-stream-id';
  active: boolean = true;
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;

  constructor() {
    // MediaStream constructor doesn't take arguments directly in tests
  }
  getTracks(): MediaStreamTrack[] {
    return [{ stop: vi.fn() }] as unknown as MediaStreamTrack[];
  }
  addTrack(track: MediaStreamTrack): void {}
  removeTrack(track: MediaStreamTrack): void {}
  clone(): MediaStream { return new MockMediaStream(); }
  getAudioTracks(): MediaStreamTrack[] { return []; }
  getVideoTracks(): MediaStreamTrack[] { return []; }
  getTrackById(trackId: string): MediaStreamTrack | null { return null; }
  getConstraints(): MediaStreamConstraints { return {}; }
  applyConstraints(constraints: MediaStreamConstraints): Promise<void> { return Promise.resolve(); }
  getSettings(): MediaTrackSettings { return {} as MediaTrackSettings; } // Cast to satisfy type
  getSupportedConstraints(): MediaTrackCapabilities { return {} as MediaTrackCapabilities; } // Cast to satisfy type

  // EventTarget methods (minimal mocks)
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}
global.MediaStream = MockMediaStream;

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  disconnect() {}
  observe(element: Element) {}
  unobserve(element: Element) {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
  callback: IntersectionObserverCallback;
}
global.IntersectionObserver = MockIntersectionObserver; // Set directly

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver; // Set directly

// Mock GeolocationPositionError
class MockGeolocationPositionError extends Error { // Removed implements GeolocationPositionError
  readonly code: number;
  static PERMISSION_DENIED: number = 1;
  static POSITION_UNAVAILABLE: number = 2;
  static TIMEOUT: number = 3;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'GeolocationPositionError';
    this.code = code;
  }
}
global.GeolocationPositionError = MockGeolocationPositionError as any; // Cast to any


// MOCK navigator.mediaDevices
// Ensure global.navigator exists
if (typeof global.navigator === 'undefined') {
  global.navigator = {} as Navigator;
}

// Define mediaDevices on the Navigator prototype
Object.defineProperty(Navigator.prototype, 'mediaDevices', {
  writable: true, // Make it writable for testing
  configurable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(new MockMediaStream())),
    enumerateDevices: vi.fn(() => Promise.resolve([])),
    // Add other MediaDevices properties as needed
  } as any, // Cast to any to bypass strict type checking for incomplete mock
});
