import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.BG_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji:   { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: 18, fontWeight: '800', color: C.TEXT, marginBottom: 8, letterSpacing: 1 },
  message: { fontSize: 12, color: C.TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  btn: {
    backgroundColor: C.PRIMARY_GLOW,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: C.PRIMARY,
  },
  btnText: { color: C.PRIMARY, fontSize: 14, fontWeight: '700' },
});
