import moment from 'moment';

export const generateGoogleCalendarUrl = (event) => {
  if (!event) return '#';

  const startDate = moment(event.start_date).format('YYYYMMDDTHHmmss');
  const endDate = event.end_date 
    ? moment(event.end_date).format('YYYYMMDDTHHmmss')
    : moment(event.start_date).add(1, 'hour').format('YYYYMMDDTHHmmss');

  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}&ctz=UTC`;
};