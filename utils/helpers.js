const formatDate = (date) => {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

const generateId = (prefix = 'ID', length = 4) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length - prefix.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
};

const calculateDueDate = (borrowDate = new Date()) => {
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 21);
    return dueDate;
};

const isOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return today > due;
};

const calculateFine = (dueDate, finePerDay = 5000) => {
    if (!isOverdue(dueDate)) return 0;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(today - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays * finePerDay;
};

const sanitizeString = (str) => {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
};

const imageToBase64 = (imageBuffer) => {
    if (!imageBuffer) return null;
    return imageBuffer.toString('base64');
};

const base64ToBuffer = (base64String) => {
    if (!base64String) return null;
    return Buffer.from(base64String, 'base64');
};

const formatResponse = (success, data = null, message = '', error = null) => {
    const response = { success };
    
    if (message) response.message = message;
    if (data !== null) response.data = data;
    if (error && process.env.NODE_ENV === 'development') response.error = error;
    
    return response;
};

const paginate = (page = 1, limit = 10, total = 0) => {
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        offset,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

const generateCardId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    return `${year}${month}${random}`;
};

const STATUS = {
    BOOK: {
        AVAILABLE: 'AVAILABLE',
        BORROWED: 'BORROWED',
        DAMAGED: 'DAMAGED',
        LOST: 'LOST',
        CREATED: 'CREATED'
    },
    BORROW: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        RETURNED: 'RETURNED',
        OVERDUE: 'OVERDUE',
        CREATED: 'CREATED'
    },
    CARD: {
        ACTIVE: 'ACTIVE',
        EXPIRED: 'EXPIRED',
        SUSPENDED: 'SUSPENDED',
        CREATED: 'CREATED'
    },
    USER: {
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        CREATED: 'CREATED'
    }
};

module.exports = {
    formatDate,
    generateId,
    isValidEmail,
    isValidPhone,
    calculateDueDate,
    isOverdue,
    calculateFine,
    sanitizeString,
    imageToBase64,
    base64ToBuffer,
    formatResponse,
    paginate,
    generateCardId,
    STATUS
};