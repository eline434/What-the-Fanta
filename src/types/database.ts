// Same field names as the tables in supabase/schema.sql,
// so rows from the database can be used without converting them.

export type Profile = {
  id: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  flavour_id: string;
  rating: number; // 1 to 5
  comment: string;
  photo_url: string | null;
  venue_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  // Joined from the profiles table, so we can show who wrote it.
  profile: Pick<Profile, 'username' | 'avatar_url'> | null;
};

// What the app sends when logging a Fanta. The database fills in id, user_id and created_at,
// the store fills in photo_url after uploading the photo.
export type NewCheckIn = {
  flavour_id: string;
  rating: number;
  comment: string;
  venue_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// A message from "Fanta", sent through the Supabase dashboard (see supabase/news.sql).
export type NewsItem = {
  id: string;
  message: string;
  image_url: string | null;
  created_at: string;
};
