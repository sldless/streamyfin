import {commonScreenOptions, nestedTabPageScreenOptions} from "@/components/stacks/NestedTabPageStack";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerTitle: "Search",
          headerBlurEffect: "prominent",
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerShadowVisible: false,
        }}
      />
      {Object.entries(nestedTabPageScreenOptions).map(([name, options]) => (
        <Stack.Screen key={name} name={name} options={options} />
      ))}
      <Stack.Screen
        name="collections/[collectionId]"
        options={{
          title: "",
          headerShown: true,
          headerBlurEffect: "prominent",
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="jellyseerr/page"
        options={commonScreenOptions}
      />
    </Stack>
  );
}
