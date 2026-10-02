import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LOGO_ASPECT_RATIO, WhatTheFantaLogo } from '@/constants/logo';
import { useAuthStore } from '@/stores/use-auth-store';

export default function SignUpScreen() {
  const signUp = useAuthStore((state) => state.signUp);

  // Local state: only this form needs it.
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setError(await signUp(email.trim(), password, username));
    setIsSubmitting(false);
    // Just like sign-in: once the account exists you're logged in, and the guard closes this screen.
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Android draws edge-to-edge, so without this the keyboard covers the inputs.
          "padding" reserves the keyboard's height at the bottom, so the ScrollView gets smaller and can scroll. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Image source={WhatTheFantaLogo} style={{ width: 220, aspectRatio: LOGO_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="What the Fanta" />
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Create an account to rate Fantas and share where you found them.
          </ThemedText>

          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Fantaloverrrr23"
            autoCapitalize="none"
            autoComplete="username"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            secureTextEntry
            onSubmitEditing={handleSignUp}
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button
            label="Create account"
            onPress={handleSignUp}
            loading={isSubmitting}
            disabled={!username || !email || !password}
          />
          <Button label="I already have an account" variant="secondary" onPress={() => router.replace('/sign-in')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
