export type GIASubject =
'История' |
'Физика' |
'Биология' |
'Обществознание' |
'Информатика и ИКТ' |
'География' |
'Химия' |
'Английский язык' |
'Русский язык' |
'Математика' |
'Литература'

export interface GIAExam {
  subject: GIASubject
  startTime: number[]
}