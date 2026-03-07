import apiClient from './client';

export interface UltimaAgreementResponse {
  requested_language: string;
  language: string;
  content: string;
  updated_at: string | null;
}

export interface UltimaAgreementUpdatePayload {
  language: string;
  content: string;
}

export const ultimaAgreementApi = {
  getAgreement: async (language: string): Promise<UltimaAgreementResponse> => {
    const response = await apiClient.get<UltimaAgreementResponse>(
      '/cabinet/info/ultima-agreement',
      {
        params: { language },
      },
    );
    return response.data;
  },

  getAdminAgreement: async (language: string): Promise<UltimaAgreementResponse> => {
    const response = await apiClient.get<UltimaAgreementResponse>(
      '/cabinet/admin/ultima-pages/agreement',
      {
        params: { language },
      },
    );
    return response.data;
  },

  updateAdminAgreement: async (
    payload: UltimaAgreementUpdatePayload,
  ): Promise<UltimaAgreementResponse> => {
    const response = await apiClient.put<UltimaAgreementResponse>(
      '/cabinet/admin/ultima-pages/agreement',
      payload,
    );
    return response.data;
  },
};
