import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, DisplayFont } from '@/constants/theme';

const colors = Colors.light;

export default function AppTabs() {
  return (
    // Android's own tab bar: the "indicator" is the rounded pill behind the selected icon,
    // the same shape as the selected button in the sketch.
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primary}
      iconColor={{ default: colors.textSecondary, selected: colors.onPrimary }}
      labelStyle={{
        default: { color: colors.textSecondary, fontFamily: DisplayFont },
        selected: { color: colors.text, fontFamily: DisplayFont },
      }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fantas">
        <NativeTabs.Trigger.Label>Fantas</NativeTabs.Trigger.Label>
        {/* Our own bottle icon (assets/images/tabIcons), "template" lets the tab bar colour it. */}
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/bottle.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
