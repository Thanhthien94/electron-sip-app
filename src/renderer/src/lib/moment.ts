import moment from 'moment-timezone'

const formatTime = (dateTime: Date) =>
  moment(dateTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
const formatTimeUTC = (dateTime: Date) =>
  moment(dateTime).tz('Africa/Abidjan').format('YYYY-MM-DD HH:mm:ss')

const pathTime = (dateTime: Date) =>
  moment(dateTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD_HH:mm:ss')

const backupTime = (dateTime: Date) => moment(dateTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD')
const backupTime2 = (dateTime: Date) => {
  const day = String(dateTime).slice(0, 10)
  return day
}

const pickTime = (dateTime: Date) => moment(dateTime).tz('Asia/Ho_Chi_Minh').format('HH:mm')
const pickHours = (dateTime: Date) => moment(dateTime).tz('Asia/Ho_Chi_Minh').format('HH')
const pickTime2 = (dateTime: Date) => {
  const time = String(dateTime).slice(11, 16)
  return time
}

const roundDownMin = (dateTime: Date) => moment(dateTime).startOf('minute')

const time = (seconds: number) => {
  const HH =
    Math.floor(seconds / (60 * 60)) < 10
      ? `0${Math.floor(seconds / (60 * 60))}`
      : String(Math.floor(seconds / (60 * 60)))
  const mm =
    Math.floor((seconds % (60 * 60)) / 60) < 10
      ? `0${Math.floor((seconds % (60 * 60)) / 60)}`
      : String(Math.floor((seconds % (60 * 60)) / 60))
  const ss = seconds % 60 < 10 ? `0${seconds % 60}` : Math.floor(seconds % 60)
  return `${HH}:${mm}:${ss}`
}
const time2 = (seconds: number) => {
  const HH =
    Math.floor(seconds / (60 * 60)) < 10
      ? `0${Math.floor(seconds / (60 * 60))}`
      : String(Math.floor(seconds / (60 * 60)))
  const mm =
    Math.floor((seconds % (60 * 60)) / 60) < 10
      ? `0${Math.floor((seconds % (60 * 60)) / 60)}`
      : String(Math.floor((seconds % (60 * 60)) / 60))
  const ss = seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60
  return `${HH} Giờ - ${mm} Phút - ${ss} Giây`
}

const roundUpMin = (dateTime: Date) =>
  moment(dateTime).second() || moment(dateTime).millisecond()
    ? moment(dateTime).add(1, 'minute').startOf('minute')
    : moment(dateTime).startOf('minute')

const roundDownHour = (dateTime: Date) => moment(dateTime).startOf('hour')

const roundHourMin = (dateTime: Date) =>
  moment(dateTime).minute() || moment(dateTime).second() || moment(dateTime).millisecond()
    ? moment(dateTime).add(1, 'hour').startOf('hour')
    : moment(dateTime).startOf('hour')

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export {
  formatTime,
  formatTimeUTC,
  backupTime,
  backupTime2,
  pickTime,
  pickTime2,
  roundDownMin,
  roundUpMin,
  roundDownHour,
  roundHourMin,
  pathTime,
  time,
  time2,
  pickHours,
  formatDate
}
