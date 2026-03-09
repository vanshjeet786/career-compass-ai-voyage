export interface BackgroundInfoDetails {
  jobTitle: string;
  yearsExperience: string;
  fieldOfStudy: string;
  specialization: string;
  currentStatus: string;
  ageRange: string;
  educationLevel: string;
  locationPreference: string;
  careerGoals: string;
  previousCounseling: string;
}

export interface BackgroundInfoData {
  userType: "student" | "professional" | "graduate" | "other";
  details: BackgroundInfoDetails;
}

export interface BackgroundInfoRecord {
  id: string;
  user_id: string;
  background_info: BackgroundInfoData;
  created_at: string | null;
}

export const EMPTY_FORM_DATA: BackgroundInfoDetails = {
  jobTitle: "",
  yearsExperience: "",
  fieldOfStudy: "",
  specialization: "",
  currentStatus: "",
  ageRange: "",
  educationLevel: "",
  locationPreference: "",
  careerGoals: "",
  previousCounseling: "",
};
