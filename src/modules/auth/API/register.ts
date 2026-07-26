import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';
import type {
  RegisterRequest,
  RegisterResponse,
} from '@/modules/auth/types/registration';

export const register = (request: RegisterRequest): Promise<IResponse<RegisterResponse>> => {
  return requester.request<RegisterResponse>({
    data: request,
    method: 'POST',
    url: '/auth/register',
  });
};
