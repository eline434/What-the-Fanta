import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

// Shared by check-ins (a photo of your Fanta) and the profile (your avatar).

// Uploads a photo from the phone to Supabase Storage and returns its public URL.
// The folder must be your own user id: the storage policy in schema.sql only allows that.
export const uploadPhoto = async (photoUri: string, name = `${Date.now()}`) => {
  const { data: { session } } = await supabase.auth.getSession();
  const path = `${session?.user.id}/${name}.jpg`;

  // Read the photo file from the phone into raw bytes, the format Supabase Storage expects.
  const photo = await new File(photoUri).arrayBuffer();
  const { error } = await supabase.storage.from('photos').upload(path, photo, { contentType: 'image/jpeg' });
  if (error) {
    throw new Error(`Could not upload your photo: ${error.message}`);
  }

  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
};

// The opposite: ".../object/public/photos/<user id>/123.jpg" → delete "<user id>/123.jpg".
// Best effort: if it fails, nothing breaks, the photo just stays in storage.
export const deletePhoto = async (photoUrl: string) => {
  const path = photoUrl.split('/object/public/photos/')[1];
  if (path) {
    await supabase.storage.from('photos').remove([path]);
  }
};
