import { admin_api } from './axios';

export type DarisiniSetting = {
    configured: boolean;
};

export const getDarisiniSetting = async (): Promise<DarisiniSetting> => {
    const res = await admin_api.get('/admin_api/settings/darisini');
    return res.data.data as DarisiniSetting;
};

export const updateDarisiniSetting = async (cookie: string): Promise<DarisiniSetting> => {
    const res = await admin_api.put('/admin_api/settings/darisini', { cookie });
    return res.data.data as DarisiniSetting;
};
