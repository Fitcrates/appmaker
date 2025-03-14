interface NavigationState {
  pathname: string;
  search: string;
  from?: string;
  filters?: Record<string, any>;
  page?: number;
  source?: {
    component: string;
    modalOpen?: boolean;
  };
}

export const saveNavigationState = (state: NavigationState) => {
  localStorage.setItem('lastNavigationState', JSON.stringify(state));
};

export const getNavigationState = (): NavigationState | null => {
  const state = localStorage.getItem('lastNavigationState');
  return state ? JSON.parse(state) : null;
};

export const clearNavigationState = () => {
  localStorage.removeItem('lastNavigationState');
};

export const saveNavigationSource = (component: string, modalOpen?: boolean) => {
  const currentState = getNavigationState() || {
    pathname: '',
    search: ''
  };
  
  saveNavigationState({
    ...currentState,
    source: {
      component,
      modalOpen
    }
  });
};
