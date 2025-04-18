import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

export const toUTC = (date = null) => {
    return dayjs(date || new Date())
        .utc()
        .format();
};

export const calculateExpiresAt = (expiresIn) => {
    // expiresIn is in seconds, add it to current time to get expiration timestamp
    return dayjs().add(expiresIn, 'second').utc().format();
};

export const formatDate = (date, options = { dateStyle: 'long' }, locale = navigator.language) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};
