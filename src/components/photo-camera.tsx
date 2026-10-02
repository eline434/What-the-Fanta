import { CameraView } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PhotoCameraProps = {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
  facing?: 'front' | 'back'; // front = selfie camera, for your avatar
};

// Full-screen camera. Only knows how to take one photo and hand it back,
// the screen that uses it decides what to do with the photo.
export function PhotoCamera({ onPhotoTaken, onClose, facing = 'back' }: PhotoCameraProps) {
  // A ref gives us the camera itself, so we can call takePictureAsync() on it.
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const insets = useSafeAreaInsets();

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }
    setIsTaking(true);
    // quality 0.5: a few hundred KB instead of several MB, much faster to upload.
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
    onPhotoTaken(photo.uri);
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} onCameraReady={() => setIsReady(true)} />

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close camera" style={styles.sideButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* The docs say: only take a photo after onCameraReady, so the shutter waits for it. */}
        <Pressable
          onPress={takePhoto}
          disabled={!isReady || isTaking}
          accessibilityLabel="Take photo"
          style={({ pressed }) => [styles.shutter, { opacity: !isReady || pressed ? 0.5 : 1 }]}>
          {isTaking && <ActivityIndicator color="#000000" />}
        </Pressable>

        {/* Empty view with the same width as the close button, keeps the shutter centred. */}
        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  sideButton: {
    width: 48,
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 28,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffffff',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
