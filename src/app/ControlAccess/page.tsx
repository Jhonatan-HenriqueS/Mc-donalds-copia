import { redirect } from 'next/navigation';

import { verifyControlAccessSession } from '@/lib/control-access';

import ControlAccessForm from './ControlAccessForm';

const ControlAccessPage = async () => {
  const hasAccess = await verifyControlAccessSession();

  if (hasAccess) {
    redirect('/ControlAccess/restaurants');
  }

  return <ControlAccessForm />;
};

export default ControlAccessPage;
