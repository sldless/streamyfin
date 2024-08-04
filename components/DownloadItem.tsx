import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import { getPlaybackInfo, useDownloadMedia } from "@/utils/jellyfin";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import ProgressCircle from "./ProgressCircle";
import { Text } from "./common/Text";
import { useQuery } from "@tanstack/react-query";

type DownloadProps = {
  item: BaseItemDto;
};

export const DownloadItem: React.FC<DownloadProps> = ({ item }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [process] = useAtom(runningProcesses);

  const { downloadMedia, isDownloading, error, cancelDownload } =
    useDownloadMedia(api, user?.Id);

  const { data: playbackInfo, isLoading } = useQuery({
    queryKey: ["playbackInfo", item.Id],
    queryFn: async () => getPlaybackInfo(api, item.Id, user?.Id),
  });

  const downloadFile = useCallback(async () => {
    if (!playbackInfo) return;

    const source = playbackInfo.MediaSources?.[0];

    if (source?.SupportsDirectPlay && item.CanDownload) {
      downloadMedia(item);
    } else {
      throw new Error(
        "Direct play not supported thus the file cannot be downloaded"
      );
    }
  }, [item, user, playbackInfo]);

  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const data: BaseItemDto[] = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      );

      if (data.find((d) => d.Id === item.Id)) setDownloaded(true);
    })();
  }, [process]);

  if (isLoading) {
    return <ActivityIndicator size={"small"} color={"white"} />;
  }

  if (playbackInfo?.MediaSources?.[0].SupportsDirectPlay === false) {
    return (
      <View style={{ opacity: 0.5 }}>
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      </View>
    );
  }

  if (process && process.item.Id !== item.Id!) {
    return (
      <TouchableOpacity onPress={() => {}} style={{ opacity: 0.5 }}>
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {process ? (
        <TouchableOpacity
          onPress={() => {
            cancelDownload();
          }}
          className="relative"
        >
          <View className="-rotate-45">
            <ProgressCircle
              size={26}
              fill={process.progress}
              width={3}
              tintColor="#3498db"
              backgroundColor="#bdc3c7"
            />
          </View>
          <View className="absolute top-0 left-0 font-bold w-full h-full flex flex-col items-center justify-center">
            <Text className="text-[6px]">{process.progress.toFixed(0)}%</Text>
          </View>
        </TouchableOpacity>
      ) : downloaded ? (
        <TouchableOpacity
          onPress={() => {
            router.push(
              `/(auth)/player/offline/page?url=${item.Id}.mp4&itemId=${item.Id}`
            );
          }}
        >
          <Ionicons name="cloud-download" size={26} color="#16a34a" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            downloadFile();
          }}
        >
          <Ionicons name="cloud-download-outline" size={26} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
