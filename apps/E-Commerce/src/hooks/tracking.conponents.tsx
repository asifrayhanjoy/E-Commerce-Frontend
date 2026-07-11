import { useEffect, useState } from "react";

const LOCATION_STORAGE_KEY = "user-location";
let locationRequest: Promise<LocationType | null> | null = null;

export interface LocationType {
  country: string;
  city: string;
  timestamp: number;
}

const getStoredLocation = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    return storedLocation ? (JSON.parse(storedLocation) as LocationType) : null;
  } catch {
    return null;
  }
};

const fetchLocation = async () => {
  const response = await fetch("http://ip-api.com/json/");
  const data = await response.json();
  const newLocation = {
    country: data?.country || "",
    city: data?.city || "",
    timestamp: Date.now(),
  };

  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));

  return newLocation;
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    const storedLocation = getStoredLocation();

    if (storedLocation) {
      setLocation(storedLocation);
      return;
    }

    locationRequest ??= fetchLocation().catch((error) => {
      console.log("Failed to get location", error);
      return null;
    });

    locationRequest.then((newLocation) => {
      if (newLocation) {
        setLocation(newLocation);
      }
    });
  }, []);

  return location;
};

export default useLocationTracking;
