import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import StudyHub from '../components/StudyHub';

export default function StudyHubScreen({ route, navigation }) {
  const { theme } = useTheme();
  const result = route?.params?.result;
  const isPremiumUser = route?.params?.isPremium || false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StudyHub
          result={result}
          isPremiumUser={isPremiumUser}
          onReset={() => navigation.navigate('Home')}
          stats={{ completed: 0, streak: 0 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
});
