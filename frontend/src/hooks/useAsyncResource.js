import { useEffect, useState } from 'react';

const initialState = { status: 'idle', data: null, error: null };

export default function useAsyncResource(factory, deps = []) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    Promise.resolve()
      .then(() => factory(controller.signal))
      .then((data) => {
        if (!active) return;
        setState({ status: 'success', data, error: null });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setState({ status: 'error', data: null, error: error?.message || 'Something went wrong.' });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    isLoading: state.status === 'loading' || state.status === 'idle',
    isError: state.status === 'error',
    isSuccess: state.status === 'success'
  };
}
