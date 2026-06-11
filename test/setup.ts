import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, clearRect() {}, drawImage() {},
    set strokeStyle(_v: string) {}, set lineWidth(_v: number) {}, set lineCap(_v: string) {},
  }),
});
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', { value: () => 'data:image/png;base64,test' });
Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false, addListener() {}, removeListener() {} }) });
class ResizeObserverMock { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverMock;
(globalThis as any).confirm = () => true;
(globalThis as any).alert = () => {};
