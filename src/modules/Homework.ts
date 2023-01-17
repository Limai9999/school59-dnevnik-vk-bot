// import moment from 'moment';
// moment.locale('ru');

// import Classes from './Classes';
// import NetCityAPI from './NetCityAPI';
// import Utils from './Utils';
// import VK from './VK';
// import Subscription from './Subscription';

// import { MainConfig } from '../types/Configs/MainConfig';
// import { GetHomework } from '../types/Homework/GetHomework';

// class Homework {
//   vk: VK;
//   classes: Classes;
//   utils: Utils;
//   netcityAPI: NetCityAPI;
//   subscription: Subscription;

//   mainConfig: MainConfig;

//   autoUpdatePeerIds: number[];
//   autoUpdateCount: number;

//   constructor(vk: VK, classes: Classes, utils: Utils, netcityAPI: NetCityAPI, subscription: Subscription, mainConfig: MainConfig) {
//     this.vk = vk;
//     this.classes = classes;
//     this.utils = utils;
//     this.netcityAPI = netcityAPI;
//     this.subscription = subscription;

//     this.mainConfig = mainConfig;

//     this.autoUpdatePeerIds = [];
//     this.autoUpdateCount = 0;
//   }

//   async startAutoUpdate(peerId: number) {
//     const isDM = this.utils.checkIfPeerIsDM(peerId);

//     if (isDM) {
//       const subscription = await this.subscription.checkSubscription(peerId);
//       if (!subscription.active) return;
//     }

//     const credentials = await this.netcityAPI.getCredentials(peerId);
//     if (!credentials) return false;

//     const isAutoUpdateAlreadyActive = this.autoUpdatePeerIds.find((autoUpdatePeerId) => autoUpdatePeerId === peerId);
//     if (isAutoUpdateAlreadyActive) return;

//     const autoUpdateMinutes = this.mainConfig.autoUpdateMin.homework;
//     const autoUpdateTime = 1000 * 60 * (autoUpdateMinutes + this.autoUpdateCount);

//     let autoUpdateInterval: NodeJS.Timer | null = null;

//     autoUpdateInterval = setInterval(async () => {
//       if (isDM) {
//         const subscription = await this.subscription.checkSubscription(peerId);
//         if (!subscription.active) {
//           console.log('Во время обновления домашнего задания, у пользователя закончилась подписка.'.bgCyan.black);

//           this.autoUpdatePeerIds = this.autoUpdatePeerIds.filter((autoUpdatePeerId) => autoUpdatePeerId !== peerId);
//           return clearInterval(autoUpdateInterval!);
//         }
//       }

//       const data = await this.getHomework(peerId, true);

//       const peerType = isDM ? 'У пользователя' : 'В беседе';

//       if (data.status) {
//         console.log(`${peerType} ${peerId} успешно обновлено домашнее задание.`.cyan);
//       } else {
//         console.log(`Не удалось обновить домашнее задание ${peerType} ${peerId}. Ошибка:`.cyan, data.error!);
//       }
//     }, autoUpdateTime);

//     this.autoUpdatePeerIds.push(peerId);

//     console.log(`Настроено авто-обновление домашнего задания для ${peerId}. (${autoUpdateMinutes} + ${this.autoUpdateCount})`.cyan);
//     this.autoUpdateCount++;

//     return true;
//   }

//   async getHomework(peerId: number, forceUpdate = false): Promise<GetHomework> {
//     const classData = await this.classes.getClass(peerId);

//     const lastUpdatedDate = classData.lastUpdatedHomework;

//     const maxLastUpdateDifference = 1000 * 60 * 5;
//     const lastUpdateDifference = Date.now() - lastUpdatedDate;

//     if (forceUpdate || lastUpdateDifference > maxLastUpdateDifference) {
//       const session = await this.netcityAPI.findOrCreateSession(peerId, false);
//       if (!session) {
//         return {
//           status: false,
//           error: 'Вы не ввели данные для Сетевого Города.',
//         };
//       }

//       if (!session.session) {
//         return {
//           status: false,
//           error: `При входе в Сетевой Город произошла ошибка:\n${session.error}`,
//         };
//       }

//       const diaryData = await this.netcityAPI.getStudentDiary(session.session.id);
//       if (!diaryData.status) {
//         return {
//           status: false,
//           error: `При получении информации из дневника произошла ошибка:\n${diaryData.error}`,
//         };
//       }

//       const todayDate = moment(new Date()).format('L');
//       const tomorrowDate = moment(Date.now() + 1000 * 60 * 60 * 24).format('L');

//       const todayWeekDay = diaryData.studentDiary!.weekDays.find((weekDay) => moment(weekDay.date).format('L') === todayDate);
//       const tomorrowWeekDay = diaryData.studentDiary!.weekDays.find((weekDay) => moment(weekDay.date).format('L') === tomorrowDate);

//       const result: GetHomework = {
//         status: true,
//         days: [todayWeekDay, tomorrowWeekDay],
//       };

//       await this.classes.setLastUpdatedHomework(peerId, Date.now());
//       await this.classes.setHomework(peerId, result);

//       return result;
//     } else {
//       return classData.homework;
//     }
//   }
// }

// export default Homework;
