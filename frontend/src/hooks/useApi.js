import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for data fetching
 * @param {Function} apiFn - Async function that returns an axios response or data
 * @param {Array} deps - Dependency array to trigger refetch
 * @param {Object} options - { immediate: boolean, initialData: any }
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function, setData: Function }}
 */
export const useApi = (apiFn, deps = [], options = { immediate: true, initialData: null }) => {
  const [data, setData] = useState(options.initialData);
  const [loading, setLoading] = useState(options.immediate);
  const [error, setError] = useState(null);

  // Keep ref to latest apiFn to prevent stale closures
  const fnRef = useRef(apiFn);
  fnRef.current = apiFn;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fnRef.current(...args);
      // If axios response, response.data, else response
      const resultData = response && response.data !== undefined ? response.data : response;
      setData(resultData);
      return { data: resultData, error: null };
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
};

export default useApi;
