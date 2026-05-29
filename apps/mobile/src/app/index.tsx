import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@proyectointegrador/design-tokens'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proyecto Integrador — Mobile</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
})
