import { toast } from 'react-toastify';

/**
 * ToastService
 * Centralized service for UI notifications using react-toastify.
 * Implementation follows UI Standardization Task requirements.
 */

const toastConfig = {
    position: "top-right",
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
};

/**
 * SUCCESS Toast
 * Auto close: 3000ms
 */
export const toastSuccess = (message) => {
    toast.success(message, {
        ...toastConfig,
        toastId: message,
        autoClose: 3000,
    });
};

/**
 * ERROR Toast
 * Auto close: 5000ms
 */
export const toastError = (message) => {
    toast.error(message, {
        ...toastConfig,
        toastId: message,
        autoClose: 5000,
    });
};

/**
 * WARNING Toast
 * Auto close: 5000ms
 */
export const toastWarning = (message) => {
    toast.warning(message, {
        ...toastConfig,
        toastId: message,
        autoClose: 5000,
    });
};

/**
 * INFO Toast
 * Auto close: 3000ms
 */
export const toastInfo = (message) => {
    toast.info(message, {
        ...toastConfig,
        toastId: message,
        autoClose: 3000,
    });
};

const ToastService = {
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
    // Shorthand aliases for backwards compatibility if needed
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
};

export default ToastService;
