export function getBasePromise(assertion: any) {
  return typeof assertion.then === 'function' ? assertion : assertion._obj;
}
