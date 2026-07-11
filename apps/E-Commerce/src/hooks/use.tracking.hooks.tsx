"use client";

import axiosInstance from "@/utils/axiosinstance";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UAParser } from "ua-parser-js";
import useLocationTracking from "./tracking.conponents";

const useDeviceTracking = () => {
  const [deviceInfo, setDeviceInfo] = useState("");

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    // Set device info only once when component mounts
    setDeviceInfo(
      `${result.device.type || "Desktop"} - ${result.os.name} ${result.os.version} - ${result.browser.name} ${result.browser.version}`
    );
  }, []);

  return deviceInfo;
};

export default useDeviceTracking;

type TrackingCounts = {
  views: number;
  wishes: number;
};

const getUserId = (user: any) => user?.id || user?._id || user?.email || "";

export const useProductTracking = ({
  productId,
  user,
}: {
  productId?: string;
  user?: any;
}) => {
  const deviceInfo = useDeviceTracking();
  const location = useLocationTracking();
  const [trackingCounts, setTrackingCounts] = useState<TrackingCounts>({
    views: 0,
    wishes: 0,
  });

  const trackingKey = useMemo(() => {
    const userId = getUserId(user);

    if (userId) {
      return `user:${userId}`;
    }

    const locationKey = location
      ? `${location.country || "unknown"}:${location.city || "unknown"}`
      : "unknown-location";

    return `guest:${deviceInfo || "unknown-device"}:${locationKey}`;
  }, [deviceInfo, location, user]);

  const refreshTrackingCounts = useCallback(async () => {
    if (!productId) {
      return;
    }

    const response = await axiosInstance.get(
      `/api/v1/products/${productId}/tracking`
    );

    setTrackingCounts({
      views: response.data.views || 0,
      wishes: response.data.wishes || 0,
    });
  }, [productId]);

  useEffect(() => {
    refreshTrackingCounts().catch((error) => {
      console.log("Failed to load product tracking", error);
    });
  }, [refreshTrackingCounts]);

  const trackProductView = useCallback(async () => {
    if (!productId || !trackingKey) {
      return;
    }

    const response = await axiosInstance.post(
      `/api/v1/products/${productId}/track-view`,
      { trackingKey }
    );

    setTrackingCounts({
      views: response.data.views || 0,
      wishes: response.data.wishes || 0,
    });
  }, [productId, trackingKey]);

  const trackProductWishlist = useCallback(
    async (action: "add" | "remove") => {
      if (!productId || !trackingKey) {
        return;
      }

      const response = await axiosInstance.post(
        `/api/v1/products/${productId}/track-wishlist`,
        { trackingKey, action }
      );

      setTrackingCounts({
        views: response.data.views || 0,
        wishes: response.data.wishes || 0,
      });
    },
    [productId, trackingKey]
  );

  return {
    deviceInfo,
    location,
    trackingCounts,
    trackProductView,
    trackProductWishlist,
    refreshTrackingCounts,
  };
};
