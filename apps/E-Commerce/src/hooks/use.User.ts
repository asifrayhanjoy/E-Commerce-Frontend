import { isProtected } from "@/store/isProtected";
import { useAuthStore } from "@/store/useAuthStor";
import axiosInstance from "@/utils/axiosinstance";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

// fetch user data from API
const fetchUser = async () => {
  const response = await axiosInstance.get("/api/v1/auth/login-in-user", isProtected);
  return response.data.user;
};

const useUser = () => {
  const { setLoggedIn } = useAuthStore();
  const { data: user, isError, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    }

    if (isError) {
      setLoggedIn(false);
    }
  }, [user, isError, setLoggedIn]);

  return {
    user: user as any,
    isLoading,
  };
};

export default useUser;
