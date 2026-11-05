export type ClinicSettings = {
  clinicName: string;
  therapistName: string;
  therapistPhone: string;
  defaultTravelBufferMinutes: number;
  workingWeekdays: number[];
  maxSessionsPerDay: number;
  sessionPrice: number;
  monthlyRevenueGoal: number;
  appointmentDurations: number[];
  appointmentTypes: string[];
};
