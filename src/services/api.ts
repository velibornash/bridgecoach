type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

const MOCK_DELAY = 200;

export function simulateDelay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockApiCall<T>(
  data: T,
  shouldFail = false,
  errorMessage = "Something went wrong"
): Promise<ApiResponse<T>> {
  await simulateDelay();
  if (shouldFail) {
    return { data: null, error: errorMessage, status: 500 };
  }
  return { data, error: null, status: 200 };
}

export async function mockPaginatedApiCall<T>(
  items: T[],
  page: number,
  pageSize: number
): Promise<ApiResponse<{ items: T[]; total: number; page: number; pageSize: number }>> {
  await simulateDelay();
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return {
    data: { items: paged, total: items.length, page, pageSize },
    error: null,
    status: 200,
  };
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null, status: 200 };
}

export function createErrorResponse<T>(message: string, status = 500): ApiResponse<T> {
  return { data: null, error: message, status };
}
