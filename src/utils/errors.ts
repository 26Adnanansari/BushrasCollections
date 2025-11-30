export interface ErrorMap {
  [key: string]: string;
}

const supabaseErrorMap: ErrorMap = {
  // Postgres error codes
  '23505': 'This item already exists',
  '23503': 'Cannot delete, item is referenced by other data',
  '42501': "You don't have permission for this action",
  '42P01': 'Database table not found',
  '23502': 'Required field is missing',
  
  // Supabase/PostgREST codes
  'PGRST116': 'Item not found',
  'PGRST301': 'Too many rows returned',
  
  // Auth specific
  'invalid_credentials': 'Invalid email or password',
  'user_already_exists': 'An account with this email already exists',
  'email_not_confirmed': 'Please verify your email address',
  'weak_password': 'Password is too weak',
  'invalid_grant': 'Invalid login credentials',
  
  // Network
  'fetch_error': 'Network error. Please check your connection',
  'timeout': 'Request timed out. Please try again',
};

export const getErrorMessage = (error: any): string => {
  // Handle Supabase/Postgres errors
  if (error?.code) {
    const mappedError = supabaseErrorMap[error.code];
    if (mappedError) return mappedError;
  }
  
  // Handle error messages
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Check for known patterns in message
    for (const [key, value] of Object.entries(supabaseErrorMap)) {
      if (message.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return original message if no mapping found
    return error.message;
  }
  
  // Default error
  return 'An unexpected error occurred. Please try again.';
};

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleAsyncError = async <T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (errorMessage) {
      err.message = errorMessage;
    }
    return [null, err];
  }
};
