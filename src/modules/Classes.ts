import Class, { IClass } from '../models/Class';

import { ParseScheduleResponse } from '../types/Responses/API/schedule/ParseScheduleResponse';
import { SubscriptionData } from '../types/Subscription/SubscriptionData';
import { GetTotalStudentReport } from '../types/Responses/API/grades/GetTotalStudentReport';
import { ManualHomework } from '../types/Homework/ManualHomework';
import { GetHomework } from '../types/Homework/GetHomework';
import { Note } from '../types/Note/Note';
import { GIAExam } from '../types/SchoolEndFeature/GIASubjects';
import { ReportStudentTotalMarks } from '../types/Responses/API/grades/ReportStudentTotalMarks';
export default class Classes {
  async getClass(peerId: number) {
    let data = await Class.findOne({ id: peerId });

    if (!data) {
      data = await Class.create({ id: peerId });
      console.log(`Создан класс ${peerId}`.bgYellow);
    }

    return data;
  }

  async getAllClasses() {
    const classes = await Class.find();
    return Array.from(classes).filter((classData) => !classData.isDisabled);
  }

  async addLastSentMessage(peerId: number, messageId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $push: { lastSentMessages: messageId },
    });
  }

  async removeLastSentMessage(peerId: number, messageId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $pull: { lastSentMessages: messageId },
    });
  }

  async setMessagesHandlingStatus(peerId: number, status: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { handleMessages: status },
    });
  }

  async setNetCityData(peerId: number, credentials: {login: string, password: string}) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { netCityData: credentials },
    });
  }

  async setClassName(peerId: number, className: string) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { className },
    });
  }

  async setSchedule(peerId: number, schedule: ParseScheduleResponse[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { schedule },
    });
  }

  async setLastUpdatedScheduleDate(peerId: number, lastUpdatedScheduleDate: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { lastUpdatedScheduleDate },
    });
  }

  async setLoading(peerId: number, isLoading: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { isLoading },
    });
  }

  async setConnectedProfiles(peerId: number, connectedProfiles: number[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { connectedProfiles },
    });
  }

  async setManualSchedule(peerId: number, manualSchedule: ParseScheduleResponse[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { manualSchedule },
    });
  }

  async setNetCitySessionId(peerId: number, netcitySessionId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { netcitySessionId },
    });
  }

  async setSubscription(peerId: number, subscription: SubscriptionData) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { subscription },
    });
  }

  async setTotalStudentReport(peerId: number, totalStudentReport: GetTotalStudentReport) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { totalStudentReport },
    });
  }

  async setReportStudentTotalMarks(peerId: number, reportStudentTotalMarks: ReportStudentTotalMarks) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { reportStudentTotalMarks },
    });
  }

  async setLastUpdatedTotalStudentReportDate(peerId: number, lastUpdatedTotalStudentReport: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { lastUpdatedTotalStudentReport },
    });
  }

  async setDisabledStatus(peerId: number, isDisabled: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { isDisabled },
    });
  }

  async addManualHomework(peerId: number, manualHomework: ManualHomework) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $push: { manualHomework },
    });
  }

  async setHomework(peerId: number, homework: GetHomework) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { homework },
    });
  }

  async setLastUpdatedHomework(peerId: number, lastUpdatedHomework: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { lastUpdatedHomework },
    });
  }

  async addNote(peerId: number, note: Note) {
    const classData = await this.getClass(peerId);

    const notes = classData.notes;
    const isAlreadyExists = notes.find((currentNote) => currentNote.filename === note.filename);

    if (isAlreadyExists) {
      isAlreadyExists.noteText = note.noteText;
    } else {
      notes.push(note);
    }

    await classData.updateOne({
      $set: { notes },
    });
  }

  async setRealUserName(peerId: number, realUserName: string) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { realUserName },
    });
  }

  async set9thClassSurveyStatus(peerId: number, survey9thClassStatus: IClass['survey9thClassStatus']) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { survey9thClassStatus },
    });
  }

  async setSurveyGIAExams(peerId: number, surveyGIAExams: GIAExam[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { surveyGIAExams },
    });
  }

  async setEndingMessage(peerId: number, endingMessage: string) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { endingMessage },
    });
  }

  async setHasEverBoughtSubscription(peerId: number, hasEverBoughtSubscription: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { hasEverBoughtSubscription },
    });
  }

  async setUsedFreeTrial(peerId: number, usedFreeTrial: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: { usedFreeTrial },
    });
  }
}
