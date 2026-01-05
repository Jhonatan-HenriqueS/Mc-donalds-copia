'use server';

import { destroySession } from './session';

export const logout = async () => {
  const result = await destroySession();
  return result;
};
