import {useMemo} from 'react';
import {useTheme} from './ThemeContext';

export function useStyles(makeStylesFn) {
  const {theme} = useTheme();

  // ✅ Only re-runs when theme actually changes, not on every render
  return useMemo(() => makeStylesFn(theme), [theme]);
}
