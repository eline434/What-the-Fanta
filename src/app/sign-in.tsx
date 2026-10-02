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

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);

  // Local state: only this form needs it.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setError(await signIn(email.trim(), password));
    setIsSubmitting(false);
    // No router.back() here: when the login works, the auth listener sets
    // status to 'signedIn' and the Stack.Protected guard closes this screen.
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
            Log in to keep track of every Fanta you have tried.
          </ThemedText>

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
            placeholder="Your password"
            autoComplete="current-password"
            secureTextEntry
            onSubmitEditing={handleSignIn}
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button label="Log in" onPress={handleSignIn} loading={isSubmitting} disabled={!email || !password} />
          <Button label="No account yet? Sign up" variant="secondary" onPress={() => router.replace('/sign-up')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
