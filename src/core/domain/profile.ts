export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  theme: "light" | "dark";
  density: string;
  notification_sound: boolean;
  desktop_toast_enabled: boolean;
  created_at: string;
  updated_at: string;
}
