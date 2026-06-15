Scaffold a new screen file for the Aetheria project.

Usage: /new-screen ScreenName
Example: /new-screen AchievementsScreen

Arguments: $ARGUMENTS

Steps:
1. Derive the file path: src/screens/$ARGUMENTS.js
   If $ARGUMENTS already ends in "Screen", use it as-is; otherwise append "Screen".

2. Check that the file does NOT already exist before creating it.

3. Create the file with this exact boilerplate, then fill in the screen-specific structure:

```js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');

export default function $ARGUMENTS({ navigation, route }) {
  return (
    <LinearGradient colors={C.GRAD_BG} style={styles.root}>
      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SCREEN TITLE</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* TODO: implement */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  backBtn:  { width: 60 },
  backText: { color: C.TEXT_SOFT, fontWeight: '700', fontSize: 12 },
  title:    { flex: 1, color: C.TEXT, fontWeight: '900', fontSize: 16, letterSpacing: 3, textAlign: 'center', textTransform: 'uppercase' },
  body:     { flex: 1, padding: 12 },
});
```

4. Register the screen in App.js — find the Stack.Navigator block and add:
   <Stack.Screen name="$ARGUMENTS" component={$ARGUMENTS} />

5. Print the file path and the App.js line added.
6. Ask the user what the screen should contain before proceeding further.
