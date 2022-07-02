import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import duration from 'dayjs/plugin/duration'
import humanize from 'dayjs/plugin/relativeTime'

dayjs.extend(duration)
dayjs.extend(humanize)
dayjs.locale('fr')

export const getYO = (dob: string) => dayjs.duration(dayjs().valueOf() - dayjs(dob).valueOf()).humanize()
