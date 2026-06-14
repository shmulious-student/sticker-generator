/** Route param list for the native-stack navigator. */
export type RootStackParamList = {
  Home: undefined;
  SelectPhotos: undefined;
  Generating: {packId: string; sourceUris: string[]};
  Review: {packId: string};
  PackDetail: {packId: string};
  Settings: undefined;
};
