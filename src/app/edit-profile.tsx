import { useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { PhotoCamera } from '@/components/photo-camera';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/user-avatar';
import { useAuthStore } from '@/stores/use-auth-store';

export default function EditProfileScreen() {
  const profile = useAuthStore((state) => state.profile);

  if (!profile) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <ThemedText themeColor="textSecondary">Your profile isn&apos;t loaded yet. Are you online?</ThemedText>
      </ThemedView>
    );
  }
  // Only rendered once the profile exists, so the form can start from its values.
  return <EditProfileForm initialUsername={profile.username} initialBio={profile.bio} avatarUrl={profile.avatar_url} />;
}

type EditProfileFormProps = {
  initialUsername: string;
  initialBio: string;
  avatarUrl: string | null;
};

const EditProfileForm = ({ initialUsername, initialBio, avatarUrl }: EditProfileFormProps) => {
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Local state: a draft of your profile. The store only changes when you press Save.
  // useState(initial) only uses the value once, when the form opens: no useEffect needed.
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same pattern as the check-in photo: ask for the camera when you want to use it.
  const openCamera = async () => {
    const isGranted = cameraPermission?.granted || (await requestCameraPermission()).granted;
    if (!isGranted) {
      setError('Allow camera access in your phone settings to change your photo.');
      return;
    }
    setError(null);
    setIsCameraOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // The store uploads the new photo, saves the profile and updates the Profile tab.
      await updateProfile({ username: username.trim(), bio: bio.trim() }, newAvatarUri);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
      setIsSaving(false);
    }
  };

  if (isCameraOpen) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <PhotoCamera
          facing="front"
          onPhotoTaken={(uri) => {
            setNewAvatarUri(uri);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      </>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: true, title: 'Edit profile' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 12 }}>
            {newAvatarUri ? (
              <Image source={newAvatarUri} style={{ width: 104, height: 104, borderRadius: 52 }} contentFit="cover" />
            ) : (
              <UserAvatar username={username || initialUsername} avatarUrl={avatarUrl} size={104} />
            )}
            <Button label="📷  Change photo" variant="secondary" onPress={openCamera} />
          </View>

          <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="I've been a real Fanta lover since 2010"
            multiline
            maxLength={160}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button label="Save" onPress={handleSave} loading={isSaving} disabled={username.trim() === ''} />
          {/* After logging out the Stack.Protected guard closes this screen by itself. */}
          <Button label="Log out" variant="secondary" onPress={signOut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};
